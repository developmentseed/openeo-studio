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
    useEditorStore.getState().hydrateFromScene('scene-1', {
      name: 'S',
      collectionId: 'sentinel-2-l2a',
      temporalRange: ['', ''],
      cloudCover: 10,
      defaultBands: [],
      boundingBox: undefined
    });
    expect(useEditorStore.getState().isDirty).toBe(false);
  });
});

describe('editor-store cloud cover', () => {
  beforeEach(() => reset());

  it('setCloudCover(undefined) removes the cloud cover filter', () => {
    useEditorStore.getState().setCloudCover(undefined);
    expect(useEditorStore.getState().selectedConfig.cloudCover).toBeUndefined();
  });

  it('hydrateFromScene keeps an absent cloudCover undefined', () => {
    useEditorStore.getState().hydrateFromScene('scene-s1', {
      name: 'S1',
      collectionId: 'sentinel-1-grd',
      temporalRange: ['', ''],
      defaultBands: []
    });
    expect(useEditorStore.getState().selectedConfig.cloudCover).toBeUndefined();
  });

  it('setCollectionId clears the property filters', () => {
    useEditorStore
      .getState()
      .setPropertyFilters([
        { property: 'sat:orbit_state', operator: 'eq', value: 'ascending' }
      ]);
    useEditorStore.getState().setCollectionId('sentinel-2-l2a');
    expect(useEditorStore.getState().selectedConfig.propertyFilters).toEqual(
      []
    );
  });
});
