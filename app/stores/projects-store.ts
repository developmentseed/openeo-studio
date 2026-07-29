import { create } from 'zustand';

import { appConfig } from '$config/runtime';
import { APIError, fetchJson } from '$utils/api';
import type { ProcessGraphSummary, ProcessGraphsResponse } from '$types';
import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';

type ProjectsState = {
  projects: ProcessGraphSummary[];
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
};

type ProjectsActions = {
  fetchProjects: (authToken: string) => Promise<void>;
};

export const useProjectsStore = create<ProjectsState & ProjectsActions>(
  (set) => ({
    projects: [],
    isLoading: false,
    isSuccess: false,
    error: null,
    fetchProjects: async (authToken) => {
      set({ isLoading: true, error: null });
      try {
        const data = await fetchJson<ProcessGraphsResponse>(
          `${appConfig.openeoApiUrl}/process_graphs`,
          authToken
        );
        set({
          projects: data.processes ?? [],
          isLoading: false,
          isSuccess: true
        });
      } catch (error) {
        const err =
          error instanceof APIError || error instanceof Error
            ? error
            : new Error('Failed to load projects');
        set({ isLoading: false, isSuccess: false, error: err });
      }
    }
  })
);

export function useProjects() {
  return {
    projects: [
      {
        id: 'huehm-aea-sdfe',
        summary: 'something something dark side',
        description: 'blabber'
      }
    ],
    isLoading: false,
    error: null
  };
  const { user } = useAuth();
  const { projects, isLoading, error, fetchProjects } = useProjectsStore();

  useEffect(() => {
    if (user?.access_token) {
      fetchProjects(user.access_token);
    }
  }, [user?.access_token, fetchProjects]);

  return {
    projects,
    isLoading,
    error
  };
}
