import { useSelector } from '@xstate/store/react';
import { sceneStore } from '.';
import { ServiceInfo } from '$types';
import { SnapshotFromStore } from '@xstate/store';

type SceneResetValue = Partial<SnapshotFromStore<typeof sceneStore>['context']>;
export const useSceneValues = () =>
  [
    useSelector(sceneStore, (state) => state.context),
    (value?: SceneResetValue) => {
      sceneStore.trigger.reset({ newState: value });
    }
  ] as const;

export const useServices = () =>
  [
    useSelector(sceneStore, (state) => state.context.services),
    (value: ServiceInfo[]) => {
      sceneStore.trigger.setServices({ services: value });
    }
  ] as const;

export const useCollectionId = () =>
  [
    useSelector(sceneStore, (state) => state.context.collectionId),
    (value: string) => {
      sceneStore.trigger.setCollectionId({ collectionId: value });
    }
  ] as const;

export const useTemporalRange = () =>
  [
    useSelector(sceneStore, (state) => state.context.temporalRange),
    (value: [string, string]) => {
      sceneStore.trigger.setTemporalRange({ temporalRange: value });
    }
  ] as const;

export const useCloudCover = () =>
  [
    useSelector(sceneStore, (state) => state.context.cloudCover),
    (value: number) => {
      sceneStore.trigger.setCloudCover({ cloudCover: value });
    }
  ] as const;

export const useSelectedBands = () =>
  [
    useSelector(sceneStore, (state) => state.context.selectedBands),
    (value: string[]) => {
      sceneStore.trigger.setSelectedBands({ selectedBands: value });
    }
  ] as const;
