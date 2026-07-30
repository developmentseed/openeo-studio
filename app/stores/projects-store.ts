import { create } from 'zustand';

import { appConfig } from '$config/runtime';
import { APIError, fetchJson } from '$utils/api';
import { upsertUserDefinedProcess } from '$utils/process-graphs';
import type { UserDefinedProcess, ProcessGraphsResponse } from '$types';
import type { ProcessGraph, ProcessParameter } from '$types/openeo-process';
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
  processGraph: ProcessGraph;
  parameters?: ProcessParameter[];
};

type ProjectsActions = {
  fetchProjects: (authToken: string) => Promise<void>;
  loadProject: (authToken: string, id: string) => Promise<UserDefinedProcess>;
  saveProject: (
    authToken: string,
    params: SaveProjectParams
  ) => Promise<UserDefinedProcess>;
  deleteProject: (authToken: string, id: string) => Promise<void>;
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
    loadProject: async (authToken, id) => {
      const project = await fetchJson<UserDefinedProcess>(
        `${appConfig.openeoApiUrl}/process_graphs/${id}`,
        authToken
      );

      set((state) => ({
        projects: [
          ...state.projects.filter((p) => p.id !== project.id),
          project
        ]
      }));

      return project;
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
    },
    deleteProject: async (authToken, id) => {
      // DELETE /process_graphs/{id} returns 204 No Content per the openEO
      // spec, so fetchJson's undefined-body handling covers this fine.
      await fetchJson<UserDefinedProcess | undefined>(
        `${appConfig.openeoApiUrl}/process_graphs/${id}`,
        authToken,
        { method: 'DELETE' }
      );

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id)
      }));
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
