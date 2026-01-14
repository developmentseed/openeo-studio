import { ServiceInfo } from '$types';
import { createStore } from '@xstate/store';

const initialState = {
  services: [] as ServiceInfo[],
  collectionId: '',
  temporalRange: ['', ''] as [string, string],
  cloudCover: 100,
  selectedBands: [] as string[]
};

export const sceneStore = createStore({
  // Initial context
  context: initialState,
  // Transitions
  on: {
    reset: (_, event: { newState?: Partial<typeof initialState> }) =>
      event.newState ? { ...initialState, ...event.newState } : initialState,
    setServices: (context, event: { services: ServiceInfo[] }) => ({
      ...context,
      services: event.services
    }),
    setCollectionId: (context, event: { collectionId: string }) => ({
      ...context,
      collectionId: event.collectionId
    }),
    setTemporalRange: (
      context,
      event: { temporalRange: [string, string] }
    ) => ({
      ...context,
      temporalRange: event.temporalRange
    }),
    setCloudCover: (context, event: { cloudCover: number }) => ({
      ...context,
      cloudCover: event.cloudCover
    }),
    setSelectedBands: (context, event: { selectedBands: string[] }) => ({
      ...context,
      selectedBands: event.selectedBands
    })
  }
});
