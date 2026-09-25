import { create } from 'zustand';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

import { APIError } from '$utils/api';
import {
  deletePermanentService,
  listPermanentServices,
  updatePermanentServiceConfiguration
} from '$utils/openeo/permanent-services';
import type { BackendService, ServiceScope } from '$types';

type ServicesState = {
  services: BackendService[];
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
};

type ServicesActions = {
  fetchServices: (authToken: string) => Promise<void>;
  deleteService: (authToken: string, id: string) => Promise<void>;
  updateServiceScope: (
    authToken: string,
    service: BackendService,
    scope: ServiceScope
  ) => Promise<void>;
};

export const useServicesStore = create<ServicesState & ServicesActions>(
  (set) => ({
    services: [],
    isLoading: false,
    isSuccess: false,
    error: null,
    fetchServices: async (authToken) => {
      set({ isLoading: true, error: null });
      try {
        const services = await listPermanentServices(authToken);
        set({
          services,
          isLoading: false,
          isSuccess: true
        });
      } catch (error) {
        const err =
          error instanceof APIError || error instanceof Error
            ? error
            : new Error('Failed to load services');
        set({ isLoading: false, isSuccess: false, error: err });
      }
    },
    deleteService: async (authToken, id) => {
      await deletePermanentService(id, authToken);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id)
      }));
    },
    updateServiceScope: async (authToken, service, scope) => {
      // PATCH only replaces first-level fields; send the full configuration.
      const configuration = { ...service.configuration, scope };
      const updated = await updatePermanentServiceConfiguration(
        service,
        authToken,
        configuration
      );

      set((state) => {
        const exists = state.services.some((s) => s.id === service.id);
        return {
          services: exists
            ? state.services.map((s) => (s.id === service.id ? updated : s))
            : [...state.services, updated]
        };
      });
    }
  })
);

export function useServices() {
  const { user } = useAuth();
  const { services, isLoading, error, fetchServices } = useServicesStore();

  useEffect(() => {
    fetchServices(user?.access_token ?? '');
  }, [user?.access_token, fetchServices]);

  return {
    services,
    isLoading,
    error
  };
}
