import { create } from 'zustand';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

import { APIError, fetchJson } from '$utils/api';
import { getServiceUrl, listPermanentServices } from '$utils/code-runner';
import type { BackendService } from '$types';

type ServicesState = {
  services: BackendService[];
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
};

type ServiceScope = 'public' | 'private';

type ServicesActions = {
  fetchServices: (authToken: string) => Promise<void>;
  deleteService: (authToken: string, id: string) => Promise<void>;
  updateServiceScope: (
    authToken: string,
    id: string,
    scope: ServiceScope
  ) => Promise<void>;
};

export const useServicesStore = create<ServicesState & ServicesActions>(
  (set, get) => ({
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
      await fetchJson(getServiceUrl(id), authToken, { method: 'DELETE' });
      set((state) => ({
        services: state.services.filter((s) => s.id !== id)
      }));
    },
    updateServiceScope: async (authToken, id, scope) => {
      const service = get().services.find((s) => s.id === id);
      if (!service) {
        throw new Error('Service not found');
      }

      // PATCH only replaces first-level fields; send the full configuration.
      const configuration = { ...service.configuration, scope };
      await fetchJson(getServiceUrl(id), authToken, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration })
      });

      set((state) => ({
        services: state.services.map((s) =>
          s.id === id ? { ...s, configuration } : s
        )
      }));
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
