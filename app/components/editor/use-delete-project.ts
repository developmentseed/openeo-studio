import { useCallback, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

import { useEditorStore } from '$stores/editor-store';
import { useProjectsStore } from '$stores/projects-store';
import { toaster } from '$utils/toaster';

interface UseDeleteProjectResult {
  onDeleteClick: () => Promise<void>;
  isBusy: boolean;
  disabled: boolean;
}

export function useDeleteProject(): UseDeleteProjectResult {
  const { user } = useAuth();
  const navigate = useNavigate();
  const sceneId = useEditorStore((state) => state.sceneId);
  const clearEditor = useEditorStore((state) => state.clearEditor);
  const deleteProject = useProjectsStore((state) => state.deleteProject);

  const [isBusy, setIsBusy] = useState(false);

  const onDeleteClick = useCallback(async () => {
    if (!sceneId || isBusy) return;

    setIsBusy(true);
    try {
      await deleteProject(user?.access_token ?? '', sceneId);
      clearEditor();
      toaster.success({ title: 'Project deleted' });
      navigate('/projects');
    } catch (error) {
      toaster.error({
        title: 'Failed to delete project',
        description: error instanceof Error ? error.message : undefined
      });
      setIsBusy(false);
    }
  }, [
    sceneId,
    isBusy,
    deleteProject,
    user?.access_token,
    clearEditor,
    navigate
  ]);

  return { onDeleteClick, isBusy, disabled: !sceneId };
}
