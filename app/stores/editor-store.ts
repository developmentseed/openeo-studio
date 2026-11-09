import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createInitialConfig,
  type EditorConfigValues
} from '$config/default-editor-config';
import type { EditorSeed, PropertyFilter, ServiceInfo } from '$types';
import type { LoadResult } from '$utils/catalogue/types';
import { resolvePropertyFilters } from '$utils/property-filters';

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
  // What the user must check in the loaded content, until they dismiss it.
  loadNotice: { external: boolean; incompatibilities: string[] } | null;
};

type ResetDefaults = Partial<ConfigValues>;

type EditorActions = {
  setCode: (code: string) => void;
  setCollectionId: (id: string) => void;
  setTemporalRange: (range: [string, string]) => void;
  // Fills in a default range; not a user edit, so it doesn't mark dirty.
  setDefaultTemporalRange: (range: [string, string]) => void;
  setPropertyFilters: (filters: PropertyFilter[]) => void;
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
    autoRun: boolean,
    notice?: Pick<LoadResult, 'external' | 'incompatibilities'>
  ) => void;
  dismissLoadNotice: () => void;
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
      loadNotice: null,
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
      setPropertyFilters: (propertyFilters) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, propertyFilters },
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
          sceneName: DEFAULT_SCENE_NAME,
          loadNotice: null
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
          contentVersion: get().contentVersion + 1,
          loadNotice: null
        });
      },
      hydrateFromScene: (sceneId, scene, autoRun, notice = {}) => {
        const { external = false, incompatibilities = [] } = notice;
        const sceneConfig = createInitialConfig({
          collectionId: scene.collectionId,
          temporalRange: scene.temporalRange,
          propertyFilters: scene.propertyFilters,
          selectedBands: scene.bands,
          boundingBox: scene.boundingBox
        });
        set({
          sceneId,
          sceneName: scene.name,
          selectedConfig: sceneConfig,
          code: scene.suggestedAlgorithm || '',
          // Code from a link exists nowhere else, so leaving it must prompt.
          isDirty: external,
          services: [],
          autoRun,
          contentVersion: get().contentVersion + 1,
          loadNotice:
            external || incompatibilities.length > 0
              ? { external, incompatibilities }
              : null
        });
      },
      dismissLoadNotice: () => set({ loadNotice: null })
    }),
    {
      name: 'openeo-editor-storage',
      storage: createJSONStorage(() => sessionStorage),
      // v1: the `cloudCover` field became an `eo:cloud_cover` property filter.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<EditorState>;
        if (version < 1 && state?.selectedConfig) {
          const { cloudCover, ...config } =
            state.selectedConfig as ConfigValues & { cloudCover?: number };
          state.selectedConfig = {
            ...config,
            propertyFilters: resolvePropertyFilters({ cloudCover })
          };
        }
        return state as EditorStore;
      },
      partialize: (state) => ({
        code: state.code,
        selectedConfig: state.selectedConfig,
        sceneId: state.sceneId,
        sceneName: state.sceneName,
        isDirty: state.isDirty,
        autoRun: state.autoRun,
        loadNotice: state.loadNotice
      })
    }
  )
);
