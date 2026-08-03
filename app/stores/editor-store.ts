import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ServiceInfo } from '$types';

type BoundingBox = [number, number, number, number];

type ConfigValues = {
  collectionId: string;
  temporalRange: [string, string];
  cloudCover: number;
  selectedBands: string[];
  boundingBox?: BoundingBox;
};

const DEFAULT_SCENE_NAME = 'New Project';

type EditorState = {
  code: string;
  hasCodeChanged: boolean;
  selectedConfig: ConfigValues;
  previousConfig: ConfigValues;
  services: ServiceInfo[];
  sceneId: string | null;
  sceneName: string;
  previousSceneName: string;
};

type ResetDefaults = Partial<ConfigValues>;

type EditorActions = {
  setCode: (code: string) => void;
  setHasCodeChanged: (changed: boolean) => void;
  setCollectionId: (id: string) => void;
  setTemporalRange: (range: [string, string]) => void;
  setCloudCover: (cover: number) => void;
  setSelectedBands: (bands: string[]) => void;
  setBoundingBox: (bbox: BoundingBox | undefined) => void;
  setServices: (services: ServiceInfo[]) => void;
  toggleServiceVisibility: (serviceId: string) => void;
  clearServices: () => void;
  setSceneId: (id: string | null) => void;
  setSceneName: (name: string) => void;
  resetToDefaults: (defaults: ResetDefaults) => void;
  clearEditor: () => void;
  hydrateFromScene: (
    sceneId: string,
    scene: {
      name: string;
      collectionId: string;
      temporalRange: [string, string];
      cloudCover: number;
      defaultBands: string[];
      boundingBox?: BoundingBox;
      suggestedAlgorithm?: string;
    }
  ) => void;
};

type EditorStore = EditorState & EditorActions;

// Helper to create initial config with defaults
const createInitialConfig = (
  overrides: Partial<ConfigValues> = {}
): ConfigValues => ({
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''],
  cloudCover: 50,
  selectedBands: [],
  boundingBox: undefined,
  ...overrides
});

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      code: '',
      hasCodeChanged: false,
      selectedConfig: createInitialConfig(),
      previousConfig: createInitialConfig(),
      services: [],
      sceneId: null,
      sceneName: DEFAULT_SCENE_NAME,
      previousSceneName: DEFAULT_SCENE_NAME,
      setCode: (code) => set({ code, hasCodeChanged: true }),
      setHasCodeChanged: (changed) => set({ hasCodeChanged: changed }),
      setCollectionId: (collectionId) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, collectionId },
          services: []
        })),
      setTemporalRange: (temporalRange) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, temporalRange },
          services: []
        })),
      setCloudCover: (cloudCover) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, cloudCover },
          services: []
        })),
      setSelectedBands: (selectedBands) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, selectedBands }
        })),
      setBoundingBox: (boundingBox) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, boundingBox }
        })),
      setServices: (services) =>
        set((state) => ({
          services,
          hasCodeChanged: false,
          previousConfig: state.selectedConfig,
          previousSceneName: state.sceneName
        })),
      toggleServiceVisibility: (serviceId) =>
        set((state) => ({
          services: state.services.map((service) =>
            service.id === serviceId
              ? { ...service, visible: !service.visible }
              : service
          )
        })),
      clearServices: () => set({ services: [] }),
      setSceneId: (sceneId) => set({ sceneId }),
      setSceneName: (sceneName) => set({ sceneName }),
      resetToDefaults: (defaults) => {
        const newConfig = createInitialConfig(defaults);
        set({
          code: '',
          hasCodeChanged: false,
          selectedConfig: newConfig,
          previousConfig: newConfig,
          services: [],
          sceneName: DEFAULT_SCENE_NAME,
          previousSceneName: DEFAULT_SCENE_NAME
        });
      },
      clearEditor: () => {
        const initialConfig = createInitialConfig();
        set({
          code: '',
          hasCodeChanged: false,
          selectedConfig: initialConfig,
          previousConfig: initialConfig,
          services: [],
          sceneId: null,
          sceneName: DEFAULT_SCENE_NAME,
          previousSceneName: DEFAULT_SCENE_NAME
        });
      },
      hydrateFromScene: (sceneId, scene) => {
        const sceneConfig = createInitialConfig({
          collectionId: scene.collectionId,
          temporalRange: scene.temporalRange,
          cloudCover: scene.cloudCover,
          selectedBands: scene.defaultBands,
          boundingBox: scene.boundingBox
        });
        set({
          sceneId,
          sceneName: scene.name,
          previousSceneName: scene.name,
          selectedConfig: sceneConfig,
          previousConfig: sceneConfig,
          code: scene.suggestedAlgorithm || '',
          hasCodeChanged: false,
          services: []
        });
      }
    }),
    {
      name: 'openeo-editor-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        code: state.code,
        selectedConfig: state.selectedConfig,
        previousConfig: state.previousConfig,
        sceneId: state.sceneId,
        sceneName: state.sceneName,
        previousSceneName: state.previousSceneName
      })
    }
  )
);
