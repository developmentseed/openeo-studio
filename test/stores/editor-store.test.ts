import { useEditorStore } from '$stores/editor-store';

const reset = () => useEditorStore.getState().clearEditor();

describe('editor-store dirty tracking', () => {
  beforeEach(() => reset());

  it('starts clean after clearEditor', () => {
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it('marks dirty when code changes', () => {
    useEditorStore.getState().setCode('print(1)');
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('marks dirty when the scene name changes', () => {
    useEditorStore.getState().setSceneName('My Project');
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('marks dirty when a config value changes', () => {
    useEditorStore.getState().setCloudCover(10);
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('marks dirty when bands change', () => {
    useEditorStore.getState().setSelectedBands(['reflectance|bands=b02']);
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('markClean clears the dirty flag', () => {
    useEditorStore.getState().setCode('x');
    useEditorStore.getState().markClean();
    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it('setServices never changes the dirty flag', () => {
    useEditorStore.getState().markClean();
    useEditorStore.getState().setServices([]);
    expect(useEditorStore.getState().isDirty).toBe(false);

    useEditorStore.getState().setCode('x');
    useEditorStore.getState().setServices([]);
    expect(useEditorStore.getState().isDirty).toBe(true);
  });

  it('hydrateFromScene resets dirty to false', () => {
    useEditorStore.getState().setCode('x');
    useEditorStore.getState().hydrateFromScene('scene-1', seed, false);
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});

const seed = {
  name: 'S',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''] as [string, string],
  cloudCover: 10,
  defaultBands: [],
  boundingBox: undefined
};

describe('editor-store content replacement', () => {
  beforeEach(() => reset());

  it('hydrates unsaved content without an id or auto-run', () => {
    useEditorStore.getState().hydrateFromScene(null, seed, false);
    expect(useEditorStore.getState().sceneId).toBeNull();
    expect(useEditorStore.getState().autoRun).toBe(false);
  });

  it('hydrates a saved project with auto-run', () => {
    useEditorStore.getState().hydrateFromScene('p1', seed, true);
    expect(useEditorStore.getState().sceneId).toBe('p1');
    expect(useEditorStore.getState().autoRun).toBe(true);
  });

  it('bumps the content version on every replacement', () => {
    const start = useEditorStore.getState().contentVersion;
    useEditorStore.getState().hydrateFromScene(null, seed, false);
    expect(useEditorStore.getState().contentVersion).toBe(start + 1);
    useEditorStore.getState().clearEditor();
    expect(useEditorStore.getState().contentVersion).toBe(start + 2);
  });

  it('clearEditor turns auto-run off', () => {
    useEditorStore.getState().hydrateFromScene('p1', seed, true);
    useEditorStore.getState().clearEditor();
    expect(useEditorStore.getState().autoRun).toBe(false);
  });

  it('persists auto-run but not the content version', () => {
    const { partialize } = useEditorStore.persist.getOptions();
    const persisted = partialize!(useEditorStore.getState());
    expect(persisted).toHaveProperty('autoRun');
    expect(persisted).not.toHaveProperty('contentVersion');
  });
});

describe('editor-store default temporal range', () => {
  beforeEach(() => reset());

  it('fills an empty range without marking the editor dirty', () => {
    useEditorStore
      .getState()
      .setDefaultTemporalRange(['2025-01-01', '2025-02-01']);
    expect(useEditorStore.getState().selectedConfig.temporalRange).toEqual([
      '2025-01-01',
      '2025-02-01'
    ]);
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});
