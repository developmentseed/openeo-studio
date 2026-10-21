import { useEffect, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { Box, Button, HStack, Stack, Text, Textarea } from '@chakra-ui/react';

import { MarkdownRenderer } from '$components/common/md-renderer';
import { appConfig } from '$config/runtime';
import type { EditorConfigValues } from '$config/default-editor-config';
import {
  useAssistantStore,
  type CodeChange,
  type ConfigurationChange,
  type Item,
  type ProposalStatus
} from '$stores/assistant-store';
import { useEditorStore } from '$stores/editor-store';
import { getSceneById } from '$config/sample-scenes';
import type { AgentEvent } from '$types/agent';
import {
  applyEdits,
  readState,
  replaceAll,
  runAgent,
  studioDocument
} from '$utils/agent';
import { useCodeEditor } from './code-editor';

const isHeld = (item: Item) => item.kind === 'proposal' && item.held;

/** Where `propose_algorithm` stores what it proposes, in the agent's state. */
const ALGORITHM_PROPOSAL = 'openeo-studio/propose_algorithm/proposal';

/** What `propose_algorithm` stores: a configuration, and the code. */
type AlgorithmProposal = Parameters<typeof configurationOf>[0] & {
  rationale: string;
  code: string;
};

/** The arguments of `propose_configuration`, in the loader's openEO terms, as
 * the editor store names them: the inverse of `projectParameters`. */
function configurationOf(args: {
  collection_id?: string;
  bands?: string[];
  time?: [string, string];
  bounding_box?: { west: number; south: number; east: number; north: number };
  cloud_cover_max?: number;
}): Partial<EditorConfigValues> {
  const box = args.bounding_box;
  return {
    ...(args.collection_id && { collectionId: args.collection_id }),
    ...(args.bands && { selectedBands: args.bands }),
    ...(args.time && { temporalRange: args.time }),
    ...(box && { boundingBox: [box.west, box.south, box.east, box.north] }),
    ...(args.cloud_cover_max !== undefined && {
      cloudCover: args.cloud_cover_max
    })
  };
}

const CONFIGURATION_LABELS: Record<keyof EditorConfigValues, string> = {
  collectionId: 'Collection',
  selectedBands: 'Bands',
  temporalRange: 'Dates',
  boundingBox: 'Area',
  cloudCover: 'Max cloud cover'
};

/** A configuration value as text: `–` when unset, lists comma-separated. */
const shown = (value: unknown) => {
  const parts = (Array.isArray(value) ? value : [value]).filter(
    (part) => part !== undefined && part !== null && part !== ''
  );
  return parts.length ? parts.join(', ') : '–';
};

const prefixed = (mark: string, text: string) =>
  text
    .split('\n')
    .map((line) => `${mark} ${line}`)
    .join('\n');

/** Each edit as the lines it removes from the code it was made against, then
 * the lines it adds. */
function CodeDiff({ change }: { change: CodeChange }) {
  const lines = change.base.split('\n');
  return change.edits.map((edit) => {
    const removed = lines.slice(edit.start_line - 1, edit.end_line).join('\n');
    return (
      <Box
        key={`${edit.start_line}-${edit.end_line}`}
        fontFamily='mono'
        fontSize='xs'
        whiteSpace='pre-wrap'
      >
        <Text color='fg.muted'>Line {edit.start_line}</Text>
        {removed && (
          <Box bg='red.subtle' px={1}>
            {prefixed('-', removed)}
          </Box>
        )}
        {edit.replace && (
          <Box bg='green.subtle' px={1}>
            {prefixed('+', edit.replace.replace(/\n$/, ''))}
          </Box>
        )}
      </Box>
    );
  });
}

/** A question for the assistant from elsewhere in the editor. */
export interface AskAssistant {
  text: string;
  at: number;
}

export function AssistantTab({
  ask,
  onAccepted
}: {
  ask?: AskAssistant;
  /** Once the last card is decided, if any was accepted: run and save, as the Save button does. */
  onAccepted?: () => void;
}) {
  const editor = useCodeEditor();
  const token = useAuth().user?.access_token;
  const {
    setCode,
    setCollectionId,
    setSelectedBands,
    setTemporalRange,
    setBoundingBox,
    setCloudCover
  } = useEditorStore();
  const { items, setItems, busy, setBusy, reset } = useAssistantStore();
  const [draft, setDraft] = useState('');
  const sentCode = useRef('');
  /** Whether this run proposed a published algorithm. */
  const algorithmProposed = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  // An accepted change not yet saved, which the last decision saves.
  const unsaved = useRef(false);

  const currentCode = () =>
    editor?.state.doc.toString() ?? useEditorStore.getState().code;

  /** The project, as the contract's state document; the agent's tools read it
   * as `@state:studio`. */
  const studioState = () => {
    const state = useEditorStore.getState();
    return {
      studio: studioDocument({
        ...state,
        isSample: !!state.sceneId && !!getSceneById(state.sceneId),
        config: state.selectedConfig,
        code: currentCode(),
        openeoApiUrl: appConfig.openeoApiUrl
      })
    };
  };

  const update = (id: string, change: (item: Item) => Item) =>
    setItems((all) =>
      all.map((item) => (item.id === id ? change(item) : item))
    );

  const onEvent = (event: AgentEvent) => {
    switch (event.type) {
      case 'TEXT_MESSAGE_START':
        setItems((all) => [
          ...all,
          { kind: 'assistant', id: event.messageId, text: '' }
        ]);
        break;
      case 'TEXT_MESSAGE_CONTENT':
        update(event.messageId, (item) =>
          item.kind === 'assistant'
            ? { ...item, text: item.text + event.delta }
            : item
        );
        break;
      case 'TOOL_CALL_START':
        setItems((all) => [
          ...all,
          {
            kind: 'tool',
            id: event.toolCallId,
            name: event.toolCallName,
            args: '',
            done: false
          }
        ]);
        break;
      case 'TOOL_CALL_ARGS':
        update(event.toolCallId, (item) =>
          item.kind === 'tool'
            ? { ...item, args: item.args + event.delta }
            : item
        );
        break;
      case 'TOOL_CALL_RESULT':
        setItems((all) =>
          all.flatMap((item): Item[] => {
            if (item.kind !== 'tool' || item.id !== event.toolCallId) {
              return [item];
            }
            const finished = { ...item, done: true };
            // The model sometimes sends the same proposal twice in a run.
            const repeats = (change: object) =>
              all.some(
                (other) =>
                  other.kind === 'proposal' &&
                  other.held &&
                  JSON.stringify(other.change) === JSON.stringify(change)
              );
            const proposal = {
              kind: 'proposal' as const,
              id: `${item.id}:proposal`,
              status: 'pending' as const,
              held: true
            };
            if (item.name === 'propose_code_edit') {
              const { edits, rationale } = JSON.parse(item.args);
              const base = sentCode.current;
              const change = { kind: 'code' as const, edits, base };
              if (applyEdits(base, edits) === null || repeats(change))
                return [finished];
              return [finished, { ...proposal, rationale, change }];
            }
            // Its code is in the agent's state, not in the call: read after
            // the run, once the state is saved.
            if (
              item.name === 'propose_algorithm' &&
              event.content.startsWith('Proposed')
            ) {
              algorithmProposed.current = true;
              return [finished];
            }
            // ponytail: the toolset's own success wording marks an accepted
            // proposal; a structured result would say it without the prose.
            if (
              item.name === 'propose_configuration' &&
              event.content.startsWith('Proposed')
            ) {
              const args = JSON.parse(item.args);
              const change = {
                kind: 'configuration' as const,
                values: configurationOf(args),
                before: useEditorStore.getState().selectedConfig
              };
              if (repeats(change)) return [finished];
              return [
                finished,
                { ...proposal, rationale: args.rationale, change }
              ];
            }
            return [finished];
          })
        );
        break;
      case 'RUN_ERROR':
        setItems((all) => [
          ...all,
          {
            kind: 'assistant',
            id: crypto.randomUUID(),
            text: `Error: ${event.message}`
          }
        ]);
        break;
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setDraft('');
    setBusy(true);
    setItems((all) => [
      ...all,
      { kind: 'user', id: crypto.randomUUID(), text }
    ]);
    try {
      const state = studioState();
      const { threadId } = useAssistantStore.getState();
      sentCode.current = state.studio.code.userCode;
      algorithmProposed.current = false;
      await runAgent(
        { url: appConfig.agentUrl, threadId, message: text, state, token },
        onEvent
      );
      if (algorithmProposed.current) {
        // ponytail: the key holds the run's last proposal, so a run proposing
        // two algorithms shows the second only; read each by turn if it matters.
        const { code, rationale, ...configuration } =
          await readState<AlgorithmProposal>(
            appConfig.agentUrl,
            threadId,
            ALGORITHM_PROPOSAL,
            token
          );
        const id = crypto.randomUUID();
        const base = sentCode.current;
        setItems((all) => [
          ...all,
          {
            kind: 'proposal',
            id: `${id}:configuration`,
            status: 'pending',
            held: true,
            rationale,
            change: {
              kind: 'configuration',
              values: configurationOf(configuration),
              before: useEditorStore.getState().selectedConfig
            }
          },
          {
            kind: 'proposal',
            id: `${id}:code`,
            status: 'pending',
            held: true,
            rationale: 'Its code, in place of yours.',
            change: { kind: 'code', edits: [replaceAll(base, code)], base }
          }
        ]);
      }
    } catch (error) {
      onEvent({
        type: 'RUN_ERROR',
        message: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setBusy(false);
      // The run's proposals are decided together, after its answer: a later
      // one is computed against the same code as an earlier one, so deciding
      // mid-run would make the rest superseded.
      setItems((all) => [
        ...all.filter((item) => !isHeld(item)),
        ...all.filter(isHeld).map((item) => ({ ...item, held: false }))
      ]);
    }
  };

  const applyConfiguration = (values: Partial<EditorConfigValues>) => {
    // The collection first: its bands are what the band picker checks.
    if (values.collectionId) setCollectionId(values.collectionId);
    if (values.selectedBands) setSelectedBands(values.selectedBands);
    if (values.temporalRange) setTemporalRange(values.temporalRange);
    if (values.boundingBox) setBoundingBox(values.boundingBox);
    if (values.cloudCover !== undefined) setCloudCover(values.cloudCover);
  };

  /** Apply code changes made against the same code, together. False when
   * the code moved on, or the edits overlap: line numbers only mean anything
   * in the code they were read from. */
  const applyCode = (changes: CodeChange[]) => {
    const { base } = changes[0];
    if (changes.some((change) => change.base !== base)) return false;
    if (currentCode() !== base) return false;
    const after = applyEdits(
      base,
      changes.flatMap((change) => change.edits)
    );
    if (after === null) return false;
    // Into the editor as well as the store: the run reads the editor, and
    // the editor's own sync from the store runs only after the effect that
    // saves an accepted change.
    editor?.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: after }
    });
    setCode(after);
    return true;
  };

  const decide = (ids: string[], accept: boolean) => {
    const chosen = useAssistantStore
      .getState()
      .items.filter(
        (item): item is Extract<Item, { kind: 'proposal' }> =>
          item.kind === 'proposal' &&
          item.status === 'pending' &&
          ids.includes(item.id)
      );
    const status = new Map<string, ProposalStatus>();
    if (!accept) {
      chosen.forEach((item) => status.set(item.id, 'rejected'));
    } else {
      for (const item of chosen) {
        if (item.change.kind === 'configuration') {
          applyConfiguration(item.change.values);
          status.set(item.id, 'accepted');
        }
      }
      const codes = chosen.filter((item) => item.change.kind === 'code');
      // All together, or failing that the first alone and the rest superseded.
      const together = codes.length
        ? applyCode(codes.map((item) => item.change as CodeChange))
        : false;
      codes.forEach((item, index) =>
        status.set(
          item.id,
          together || (index === 0 && applyCode([item.change as CodeChange]))
            ? 'accepted'
            : 'superseded'
        )
      );
    }
    setItems((all) =>
      all.map((item) =>
        status.has(item.id) ? { ...item, status: status.get(item.id)! } : item
      )
    );
    if ([...status.values()].includes('accepted')) unsaved.current = true;
    if (unsaved.current && pending.every((item) => ids.includes(item.id))) {
      unsaved.current = false;
      onAccepted?.();
    }
  };

  const pending = items.filter(
    (item) =>
      item.kind === 'proposal' && item.status === 'pending' && !item.held
  );

  useEffect(() => {
    if (ask) send(ask.text);
    // Only a new question sends.
  }, [ask?.at]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [items]);

  return (
    <Stack h='100%' gap={3}>
      <Stack flex={1} gap={3} overflowY='auto' fontSize='sm'>
        {items.length === 0 && (
          <Text color='fg.muted'>
            Ask about your code, a collection or an error. The assistant reads
            your project, and proposes changes for you to accept.
          </Text>
        )}
        {items.map((item) => {
          if (item.kind === 'user') {
            return (
              <Box
                key={item.id}
                alignSelf='flex-end'
                bg='bg.muted'
                px={3}
                py={2}
                borderRadius='md'
                whiteSpace='pre-wrap'
              >
                {item.text}
              </Box>
            );
          }
          if (item.kind === 'assistant') {
            return item.text ? (
              <Box key={item.id}>
                <MarkdownRenderer>{item.text}</MarkdownRenderer>
              </Box>
            ) : null;
          }
          if (item.kind === 'tool') {
            return (
              <Text
                key={item.id}
                fontSize='xs'
                color='fg.muted'
                fontFamily='mono'
              >
                {item.done ? '✓' : '…'} {item.name}
              </Text>
            );
          }
          if (item.held) {
            return (
              <Text key={item.id} fontSize='xs' color='fg.muted'>
                Proposed: {item.rationale}
              </Text>
            );
          }
          return (
            <Stack
              key={item.id}
              gap={2}
              p={3}
              borderWidth='1px'
              borderRadius='md'
            >
              <Text fontWeight='semibold'>{item.rationale}</Text>
              {item.change.kind === 'code' && <CodeDiff change={item.change} />}
              {item.change.kind === 'configuration' &&
                Object.entries(item.change.values).map(([key, value]) => {
                  const field = key as keyof EditorConfigValues;
                  const { before } = item.change as ConfigurationChange;
                  if (shown(before[field]) === shown(value)) return null;
                  return (
                    <Text key={key} fontSize='xs'>
                      <Text as='span' color='fg.muted'>
                        {CONFIGURATION_LABELS[field]}:
                      </Text>{' '}
                      {shown(before[field])} → <strong>{shown(value)}</strong>
                    </Text>
                  );
                })}
              {item.status === 'pending' ? (
                <HStack>
                  <Button size='xs' onClick={() => decide([item.id], true)}>
                    Accept
                  </Button>
                  <Button
                    size='xs'
                    variant='outline'
                    onClick={() => decide([item.id], false)}
                  >
                    Reject
                  </Button>
                </HStack>
              ) : (
                <Text fontSize='xs' color='fg.muted'>
                  {
                    {
                      accepted: 'Accepted.',
                      rejected: 'Rejected.',
                      superseded: 'The code changed since this was proposed.'
                    }[item.status]
                  }
                </Text>
              )}
            </Stack>
          );
        })}
        {pending.length > 1 && (
          <HStack>
            <Button
              size='xs'
              onClick={() =>
                decide(
                  pending.map((item) => item.id),
                  true
                )
              }
            >
              Accept all
            </Button>
            <Button
              size='xs'
              variant='outline'
              onClick={() =>
                decide(
                  pending.map((item) => item.id),
                  false
                )
              }
            >
              Reject all
            </Button>
          </HStack>
        )}
        <div ref={end} />
      </Stack>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <Stack gap={2}>
          <Textarea
            size='sm'
            rows={3}
            value={draft}
            placeholder='Why is my layer blank?'
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send(draft);
              }
            }}
          />
          <HStack justifyContent='space-between'>
            <Button
              size='xs'
              variant='ghost'
              disabled={busy}
              onClick={() => {
                reset();
              }}
            >
              New chat
            </Button>
            <Button size='xs' type='submit' loading={busy}>
              Send
            </Button>
          </HStack>
        </Stack>
      </form>
    </Stack>
  );
}
