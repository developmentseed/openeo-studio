import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createInitialConfig,
  type EditorConfigValues
} from '$config/default-editor-config';
import type { GraphResult, PropertyFilter, ServiceInfo } from '$types';
import { resolvePropertyFilters } from '$utils/property-filters';

import { useAssistantStore } from './assistant-store';

type BoundingBox = [number, number, number, number];

/** What the last run produced, for the assistant. Not persisted. */
export type LastRun = {
  graphs: GraphResult[];
  error: string | null;
  /** When it ran, as ISO 8601; stamped by setLastRun. */
  at?: string;
};

type ConfigValues = EditorConfigValues;

const DEFAULT_SCENE_NAME = 'New Project';

type EditorState = {
  code: string;
  isDirty: boolean;
  /** Counts the changes to the project, for the agent contract. */
  revision: number;
  selectedConfig: ConfigValues;
  services: ServiceInfo[];
  sceneId: string | null;
  sceneName: string;
  lastRun: LastRun | null;
};

type ResetDefaults = Partial<ConfigValues>;

type EditorActions = {
  setCode: (code: string) => void;
  setLastRun: (lastRun: LastRun | null) => void;
  setCollectionId: (id: string) => void;
  setTemporalRange: (range: [string, string]) => void;
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
    scene: {
      name: string;
      collectionId: string;
      temporalRange: [string, string];
      propertyFilters?: PropertyFilter[];
      defaultBands: string[];
      boundingBox?: BoundingBox;
      suggestedAlgorithm?: string;
    }
  ) => void;
};

type EditorStore = EditorState & EditorActions;

/** A change by the user or an accepted proposal: unsaved, and a new revision. */
const changed = (state: EditorState) => ({
  isDirty: true,
  revision: state.revision + 1
});

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      code: '',
      isDirty: false,
      revision: 0,
      selectedConfig: createInitialConfig(),
      services: [],
      sceneId: null,
      sceneName: DEFAULT_SCENE_NAME,
      lastRun: null,
      setCode: (code) => set((state) => ({ code, ...changed(state) })),
      setLastRun: (lastRun) =>
        set({
          lastRun: lastRun && { ...lastRun, at: new Date().toISOString() }
        }),
      setCollectionId: (collectionId) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, collectionId },
          services: [],
          ...changed(state)
        })),
      setTemporalRange: (temporalRange) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, temporalRange },
          services: [],
          ...changed(state)
        })),
      setPropertyFilters: (propertyFilters) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, propertyFilters },
          services: [],
          ...changed(state)
        })),
      setSelectedBands: (selectedBands) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, selectedBands },
          ...changed(state)
        })),
      setBoundingBox: (boundingBox) =>
        set((state) => ({
          selectedConfig: { ...state.selectedConfig, boundingBox },
          ...changed(state)
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
      setSceneId: (sceneId) => {
        set({ sceneId });
        // Null is the blank project; an id is this project, just saved.
        const assistant = useAssistantStore.getState();
        if (sceneId === null) assistant.forProject(null);
        else assistant.adopt(sceneId);
      },
      setSceneName: (sceneName) =>
        set((state) => ({ sceneName, ...changed(state) })),
      markClean: () => set({ isDirty: false }),
      resetToDefaults: (defaults) => {
        const newConfig = createInitialConfig(defaults);
        set({
          code: '',
          isDirty: false,
          selectedConfig: newConfig,
          services: [],
          lastRun: null,
          sceneName: DEFAULT_SCENE_NAME
        });
      },
      clearEditor: () => {
        useAssistantStore.getState().forProject(null);
        const initialConfig = createInitialConfig();
        set({
          code: '',
          isDirty: false,
          selectedConfig: initialConfig,
          services: [],
          lastRun: null,
          sceneId: null,
          sceneName: DEFAULT_SCENE_NAME
        });
      },
      hydrateFromScene: (sceneId, scene) => {
        useAssistantStore.getState().forProject(sceneId);
        const sceneConfig = createInitialConfig({
          collectionId: scene.collectionId,
          temporalRange: scene.temporalRange,
          propertyFilters: scene.propertyFilters ?? [],
          selectedBands: scene.defaultBands,
          boundingBox: scene.boundingBox
        });
        set({
          sceneId,
          sceneName: scene.name,
          selectedConfig: sceneConfig,
          code: scene.suggestedAlgorithm || '',
          isDirty: false,
          services: [],
          lastRun: null
        });
      }
    }),
    {
      name: 'openeo-editor-storage',
      storage: createJSONStorage(() => sessionStorage),
      // v1: the deprecated `cloudCover` field became an `eo:cloud_cover`
      // property filter.
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<EditorState>;
        if (version < 1 && state?.selectedConfig) {
          const { cloudCover, ...config } =
            state.selectedConfig as ConfigValues & {
              cloudCover?: number;
            };
          state.selectedConfig = {
            ...config,
            propertyFilters: resolvePropertyFilters({
              cloudCover,
              propertyFilters: config.propertyFilters
            })
          };
        }
        return state as EditorStore;
      },
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
