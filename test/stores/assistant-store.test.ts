import {
  supersedePending,
  useAssistantStore,
  type Item
} from '$stores/assistant-store';

const talk = () =>
  useAssistantStore
    .getState()
    .setItems(() => [{ kind: 'user', id: '1', text: 'hi' }]);

describe('the assistant conversation follows the project', () => {
  beforeEach(() => useAssistantStore.getState().forProject(null));

  it('starts afresh for another project and keeps going for the same one', () => {
    useAssistantStore.getState().forProject('a');
    talk();
    const thread = useAssistantStore.getState().threadId;

    useAssistantStore.getState().forProject('a');
    expect(useAssistantStore.getState().items).toHaveLength(1);
    expect(useAssistantStore.getState().threadId).toBe(thread);

    useAssistantStore.getState().forProject('b');
    expect(useAssistantStore.getState().items).toHaveLength(0);
    expect(useAssistantStore.getState().threadId).not.toBe(thread);
  });

  it('drops the busy run and the pending save of the old project', () => {
    useAssistantStore.getState().forProject('a');
    useAssistantStore.getState().setBusy(true);
    useAssistantStore.getState().setUnsaved(true);

    useAssistantStore.getState().forProject('b');
    expect(useAssistantStore.getState().busy).toBe(false);
    expect(useAssistantStore.getState().unsaved).toBe(false);
  });

  it('survives saving an unsaved project, and a new blank project resets it', () => {
    talk();
    useAssistantStore.getState().adopt('saved');
    expect(useAssistantStore.getState().items).toHaveLength(1);
    expect(useAssistantStore.getState().project).toBe('saved');

    useAssistantStore.getState().forProject(null);
    expect(useAssistantStore.getState().items).toHaveLength(0);
  });
});

it('saves a held proposal released, so a reload mid-run still shows it', () => {
  useAssistantStore.getState().setItems(() => [
    {
      kind: 'proposal',
      id: 'p',
      rationale: 'r',
      status: 'pending',
      held: true,
      change: { kind: 'code', edits: [], base: '' }
    }
  ]);
  const saved = JSON.parse(sessionStorage.getItem('openeo-assistant-storage')!);
  expect(saved.state.items[0].held).toBe(false);
  expect(useAssistantStore.getState().items[0]).toMatchObject({ held: true });
});

it('saves the pending save, so the last decision after a reload still saves', () => {
  useAssistantStore.getState().setUnsaved(true);
  const saved = JSON.parse(sessionStorage.getItem('openeo-assistant-storage')!);
  expect(saved.state.unsaved).toBe(true);
  expect(saved.state).not.toHaveProperty('busy');
});

it('supersedes the cards still waiting when the user asks again', () => {
  const card = (id: string, status: 'pending' | 'accepted'): Item => ({
    kind: 'proposal',
    id,
    rationale: 'r',
    status,
    held: false,
    change: { kind: 'code', edits: [], base: '' }
  });
  const items = supersedePending([
    { kind: 'user', id: 'u', text: 'hi' },
    card('waiting', 'pending'),
    card('done', 'accepted')
  ]);
  expect(
    items.map((item) => (item.kind === 'proposal' ? item.status : item.kind))
  ).toEqual(['user', 'superseded', 'accepted']);
});

it('keeps a question from elsewhere for the conversation it was asked in', () => {
  const store = useAssistantStore.getState();
  store.ask('Why?');
  const { question, threadId } = useAssistantStore.getState();
  expect(question).toMatchObject({ text: 'Why?', thread: threadId });

  expect(useAssistantStore.getState().takeQuestion()).toEqual(question);
  expect(useAssistantStore.getState().question).toBeNull();

  store.ask('Again?');
  useAssistantStore.getState().reset();
  expect(useAssistantStore.getState().question).toBeNull();
});

it('does not save a check that a reload would cut off', () => {
  const card = (id: string, status: 'checking' | 'failed'): Item => ({
    kind: 'proposal',
    id,
    rationale: 'r',
    status: 'pending',
    held: false,
    change: { kind: 'code', edits: [], base: '' },
    check: { status, message: 'm' }
  });
  useAssistantStore
    .getState()
    .setItems(() => [card('a', 'checking'), card('b', 'failed')]);
  const saved = JSON.parse(sessionStorage.getItem('openeo-assistant-storage')!);
  expect(saved.state.items[0].check).toBeUndefined();
  expect(saved.state.items[1].check).toEqual({
    status: 'failed',
    message: 'm'
  });
});
