import { create } from 'zustand';

import { appConfig } from '$config/runtime';
import { APIError, fetchJson } from '$utils/api';
import { upsertUserDefinedProcess } from '$utils/process-graphs';
import type { UserDefinedProcess, ProcessGraphsResponse } from '$types';
import { useAuth } from 'react-oidc-context';
import { useEffect } from 'react';

type ProjectsState = {
  projects: UserDefinedProcess[];
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
};

type SaveProjectParams = {
  id: string;
  summary: string;
  code: string;
  processGraph: unknown;
  parameters?: unknown[];
};

type ProjectsActions = {
  fetchProjects: (authToken: string) => Promise<void>;
  saveProject: (
    authToken: string,
    params: SaveProjectParams
  ) => Promise<UserDefinedProcess>;
};

export const useProjectsStore = create<ProjectsState & ProjectsActions>(
  (set, get) => ({
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
    },
    saveProject: async (authToken, params) => {
      const description = get().projects.find(
        (p) => p.id === params.id
      )?.description;

      const project = await upsertUserDefinedProcess(authToken, {
        ...params,
        description
      });

      set((state) => ({
        projects: [
          ...state.projects.filter((p) => p.id !== project.id),
          project
        ]
      }));

      return project;
    }
  })
);

export function useProjects() {
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
