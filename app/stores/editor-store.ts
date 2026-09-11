import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createInitialConfig,
  type EditorConfigValues
} from '$config/default-editor-config';
import type { ServiceInfo } from '$types';

type BoundingBox = [number, number, number, number];

type ConfigValues = EditorConfigValues;

const DEFAULT_SCENE_NAME = 'New Project';

type EditorState = {
  code: string;
  isDirty: boolean;
  selectedConfig: ConfigValues;
  services: ServiceInfo[];
  sceneId: string | null;
  sceneName: string;
};

type ResetDefaults = Partial<ConfigValues>;

type EditorActions = {
  setCode: (code: string) => void;
  setCollectionId: (id: string) => void;
  setTemporalRange: (range: [string, string]) => void;
  setCloudCover: (cover: number) => void;
  setSelectedBands: (bands: string[]) => void;
  setBoundingBox: (bbox: BoundingBox | undefined) => void;
  setServices: (services: ServiceInfo[]) => void;
  toggleServiceVisibility: (serviceId: string) => void;
  setSceneId: (id: string | null) => void;
  setSceneName: (name: string) => void;
  markClean: () => void;
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

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      code: '',
      isDirty: false,
      selectedConfig: createInitialConfig(),
      services: [],
      sceneId: null,
      sceneName: DEFAULT_SCENE_NAME,
      setCode: (code) => set({ code, isDirty: true }),
      setCollectionId: (collectionId) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, collectionId },
          services: [],
          isDirty: true
        })),
      setTemporalRange: (temporalRange) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, temporalRange },
          services: [],
          isDirty: true
        })),
      setCloudCover: (cloudCover) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, cloudCover },
          services: [],
          isDirty: true
        })),
      setSelectedBands: (selectedBands) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, selectedBands },
          isDirty: true
        })),
      setBoundingBox: (boundingBox) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, boundingBox },
          isDirty: true
        })),
      setServices: (services) => set({ services }),
      toggleServiceVisibility: (serviceId) =>
        set((state) => ({
          services: state.services.map((service) =>
            service.id === serviceId
              ? { ...service, visible: !service.visible }
              : service
          )
        })),
      setSceneId: (sceneId) => set({ sceneId }),
      setSceneName: (sceneName) => set({ sceneName, isDirty: true }),
      markClean: () => set({ isDirty: false }),
      resetToDefaults: (defaults) => {
        const newConfig = createInitialConfig(defaults);
        set({
          code: '',
          isDirty: false,
          selectedConfig: newConfig,
          services: [],
          sceneName: DEFAULT_SCENE_NAME
        });
      },
      clearEditor: () => {
        const initialConfig = createInitialConfig();
        set({
          code: '',
          isDirty: false,
          selectedConfig: initialConfig,
          services: [],
          sceneId: null,
          sceneName: DEFAULT_SCENE_NAME
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
          selectedConfig: sceneConfig,
          code: scene.suggestedAlgorithm || '',
          isDirty: false,
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
        sceneId: state.sceneId,
        sceneName: state.sceneName,
        isDirty: state.isDirty
      })
    }
  )
);
