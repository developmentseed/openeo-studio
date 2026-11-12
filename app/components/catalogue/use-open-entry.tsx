import { useCallback, useRef, useState } from 'react';
import { Text } from '@chakra-ui/react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

import { useConfirmDialog } from '$components/common/use-confirm-dialog';
import { catalogue } from '$config/catalogue';
import { useEditorStore } from '$stores/editor-store';
import {
  IncompatibleProjectError,
  isNotFound
} from '$utils/catalogue/catalogue';
import type { LoadRef } from '$utils/catalogue/types';
import { toaster } from '$utils/toaster';

/**
 * Every action that replaces the editor contents goes through this, so
 * unsaved work is never thrown away without asking.
 */
export function useReplaceEditorContents() {
  const { confirm, dialog } = useConfirmDialog();

  const replaceEditorContents = useCallback(
    async (apply: () => void) => {
      if (useEditorStore.getState().isDirty) {
        const confirmed = await confirm({
          title: 'Discard unsaved changes?',
          body: (
            <Text fontSize='sm' color='fg.muted'>
              Your current work isn&apos;t saved. Continuing will replace it.
            </Text>
          ),
          confirmLabel: 'Discard'
        });
        if (!confirmed) return false;
      }
      apply();
      return true;
    },
    [confirm]
  );

  return { replaceEditorContents, dialog };
}

export function useNewProject() {
  const navigate = useNavigate();
  const { replaceEditorContents, dialog } = useReplaceEditorContents();

  const newProject = useCallback(async () => {
    const replaced = await replaceEditorContents(() =>
      useEditorStore.getState().clearEditor()
    );
    if (replaced) navigate('/editor');
  }, [navigate, replaceEditorContents]);

  return { newProject, dialog };
}

interface OpenOptions {
  replace?: boolean;
  // Opened from a URL: a missing entry shows the 404 page, not a toast.
  fromLink?: boolean;
}

export function useOpenEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { replaceEditorContents, dialog } = useReplaceEditorContents();
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const inflight = useRef<AbortController | null>(null);

  const openEntry = useCallback(
    async (open: LoadRef, options: OpenOptions = {}) => {
      const replace = options.replace ?? false;
      // Only the latest click counts: cancel the load it replaces.
      inflight.current?.abort();
      const controller = new AbortController();
      inflight.current = controller;
      setPendingRef(open.ref);
      try {
        const { seed, projectId, autoRun } = await catalogue.load(open, {
          authToken: user?.access_token,
          signal: controller.signal
        });
        if (controller.signal.aborted) return;
        const replaced = await replaceEditorContents(() =>
          useEditorStore
            .getState()
            .hydrateFromScene(projectId ?? null, seed, autoRun)
        );
        if (replaced) {
          navigate(projectId ? `/editor/${projectId}` : '/editor', {
            replace
          });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (
          error instanceof IncompatibleProjectError ||
          (options.fromLink && isNotFound(error))
        ) {
          navigate('/editor', {
            replace,
            state: { notFound: (error as Error).message }
          });
        } else {
          toaster.error({
            title: "Couldn't open project",
            description: error instanceof Error ? error.message : String(error)
          });
        }
      } finally {
        if (inflight.current === controller) {
          inflight.current = null;
          setPendingRef(null);
        }
      }
    },
    [navigate, replaceEditorContents, user?.access_token]
  );

  return { openEntry, pendingRef, dialog };
}
