import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ServiceInfo } from '$types';

type BoundingBox = [number, number, number, number];

type EditorState = {
  code: string;
  hasCodeChanged: boolean;
  collectionId: string;
  temporalRange: [string, string];
  cloudCover: number;
  selectedBands: string[];
  boundingBox?: BoundingBox;
  services: ServiceInfo[];
  sceneId: string | null;
};

type ResetDefaults = Pick<
  EditorState,
  | 'collectionId'
  | 'cloudCover'
  | 'temporalRange'
  | 'selectedBands'
  | 'boundingBox'
>;

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
  resetToDefaults: (defaults: ResetDefaults) => void;
  clearEditor: () => void;
  hydrateFromScene: (
    sceneId: string,
    scene: {
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

const initialState: EditorState = {
  code: '',
  hasCodeChanged: false,
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['', ''],
  cloudCover: 50,
  selectedBands: [],
  boundingBox: undefined,
  services: [],
  sceneId: null
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      ...initialState,
      setCode: (code) => set({ code, hasCodeChanged: true }),
      setHasCodeChanged: (changed) => set({ hasCodeChanged: changed }),
      setCollectionId: (collectionId) => set({ collectionId, services: [] }),
      setTemporalRange: (temporalRange) => set({ temporalRange, services: [] }),
      setCloudCover: (cloudCover) => set({ cloudCover, services: [] }),
      setSelectedBands: (selectedBands) => set({ selectedBands }),
      setBoundingBox: (boundingBox) => set({ boundingBox }),
      setServices: (services) => set({ services, hasCodeChanged: false }),
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
      resetToDefaults: (defaults) =>
        set({
          ...initialState,
          ...defaults,
          hasCodeChanged: false,
          services: []
        }),
      clearEditor: () => set({ ...initialState }),
      hydrateFromScene: (sceneId, scene) =>
        set({
          sceneId,
          collectionId: scene.collectionId,
          temporalRange: scene.temporalRange,
          cloudCover: scene.cloudCover,
          selectedBands: scene.defaultBands,
          boundingBox: scene.boundingBox,
          code: scene.suggestedAlgorithm || '',
          hasCodeChanged: false,
          services: []
        })
    }),
    {
      name: 'openeo-editor-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        code: state.code,
        collectionId: state.collectionId,
        temporalRange: state.temporalRange,
        cloudCover: state.cloudCover,
        selectedBands: state.selectedBands,
        boundingBox: state.boundingBox,
        sceneId: state.sceneId
      })
    }
  )
);
