import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createInitialConfig,
  type EditorConfigValues
} from '$config/default-editor-config';
import type { EditorSeed, ServiceInfo } from '$types';

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
  // Whether the current content runs on its own when the editor is ready.
  autoRun: boolean;
  // Bumped whenever the content is replaced, so the editor can remount.
  contentVersion: number;
};

type ResetDefaults = Partial<ConfigValues>;

type EditorActions = {
  setCode: (code: string) => void;
  setCollectionId: (id: string) => void;
  setTemporalRange: (range: [string, string]) => void;
  // Fills in a default range; not a user edit, so it doesn't mark dirty.
  setDefaultTemporalRange: (range: [string, string]) => void;
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
    sceneId: string | null,
    scene: EditorSeed,
    autoRun: boolean
  ) => void;
};

type EditorStore = EditorState & EditorActions;

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      code: '',
      isDirty: false,
      selectedConfig: createInitialConfig(),
      services: [],
      sceneId: null,
      sceneName: DEFAULT_SCENE_NAME,
      autoRun: false,
      contentVersion: 0,
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
      setDefaultTemporalRange: (temporalRange) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, temporalRange }
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
          sceneName: DEFAULT_SCENE_NAME,
          autoRun: false,
          contentVersion: get().contentVersion + 1
        });
      },
      hydrateFromScene: (sceneId, scene, autoRun) => {
        const sceneConfig = createInitialConfig({
          collectionId: scene.collectionId,
          temporalRange: scene.temporalRange,
          cloudCover: scene.cloudCover,
          selectedBands: scene.bands,
          boundingBox: scene.boundingBox
        });
        set({
          sceneId,
          sceneName: scene.name,
          selectedConfig: sceneConfig,
          code: scene.suggestedAlgorithm || '',
          isDirty: false,
          services: [],
          autoRun,
          contentVersion: get().contentVersion + 1
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
        isDirty: state.isDirty,
        autoRun: state.autoRun
      })
    }
  )
);
