import { useAssistantStore } from '$stores/assistant-store';

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
