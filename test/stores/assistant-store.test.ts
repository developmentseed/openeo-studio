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

  it('survives saving an unsaved project, and a new blank project resets it', () => {
    talk();
    useAssistantStore.getState().adopt('saved');
    expect(useAssistantStore.getState().items).toHaveLength(1);
    expect(useAssistantStore.getState().project).toBe('saved');

    useAssistantStore.getState().forProject(null);
    expect(useAssistantStore.getState().items).toHaveLength(0);
  });
});
