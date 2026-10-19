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
    useEditorStore
      .getState()
      .setPropertyFilters([
        { property: 'eo:cloud_cover', operator: 'lt', value: 10 }
      ]);
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
    useEditorStore.getState().hydrateFromScene('scene-1', {
      name: 'S',
      collectionId: 'sentinel-2-l2a',
      temporalRange: ['', ''],
      propertyFilters: [
        { property: 'eo:cloud_cover', operator: 'lt', value: 10 }
      ],
      defaultBands: [],
      boundingBox: undefined
    });
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});

describe('editor-store property filters', () => {
  beforeEach(() => reset());

  it('starts with the default cloud cover filter', () => {
    expect(useEditorStore.getState().selectedConfig.propertyFilters).toEqual([
      { property: 'eo:cloud_cover', operator: 'lt', value: 50 }
    ]);
  });

  it('setPropertyFilters([]) removes all filters', () => {
    useEditorStore.getState().setPropertyFilters([]);
    expect(useEditorStore.getState().selectedConfig.propertyFilters).toEqual(
      []
    );
  });

  it('hydrateFromScene without filters sets no filter', () => {
    useEditorStore.getState().hydrateFromScene('scene-s1', {
      name: 'S1',
      collectionId: 'sentinel-1-grd',
      temporalRange: ['', ''],
      defaultBands: []
    });
    expect(useEditorStore.getState().selectedConfig.propertyFilters).toEqual(
      []
    );
  });

  it('setCollectionId keeps the property filters', () => {
    const filters = [
      { property: 'eo:cloud_cover', operator: 'lt' as const, value: 20 }
    ];
    useEditorStore.getState().setPropertyFilters(filters);
    useEditorStore.getState().setCollectionId('sentinel-2-l1c');
    expect(useEditorStore.getState().selectedConfig.propertyFilters).toEqual(
      filters
    );
  });

  it('migrates a stored cloudCover to a cloud cover filter', async () => {
    sessionStorage.setItem(
      'openeo-editor-storage',
      JSON.stringify({
        version: 0,
        state: {
          code: '',
          sceneId: null,
          sceneName: 'Old',
          isDirty: false,
          selectedConfig: {
            collectionId: 'sentinel-2-l2a',
            temporalRange: ['', ''],
            cloudCover: 30,
            selectedBands: []
          }
        }
      })
    );

    await useEditorStore.persist.rehydrate();

    const config = useEditorStore.getState().selectedConfig;
    expect(config).not.toHaveProperty('cloudCover');
    expect(config.propertyFilters).toEqual([
      { property: 'eo:cloud_cover', operator: 'lt', value: 30 }
    ]);
    sessionStorage.clear();
  });
});
