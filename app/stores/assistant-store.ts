import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EditorConfigValues } from '$config/default-editor-config';
import type { ProposalStatus as ContractProposalStatus } from '$types/agent';
import type { CodeEdit } from '$utils/agent';

export interface CodeChange {
  kind: 'code';
  edits: CodeEdit[];
  /** The code the run was sent with, which the line numbers refer to. */
  base: string;
}

export interface ConfigurationChange {
  kind: 'configuration';
  values: Partial<EditorConfigValues>;
  /** The configuration when it was proposed, to show what changes. */
  before: EditorConfigValues;
}

/** The contract's statuses that the `ask` apply mode reaches. */
export type ProposalStatus = Extract<
  ContractProposalStatus,
  'pending' | 'accepted' | 'rejected' | 'superseded'
>;

export type Item =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string }
  | { kind: 'tool'; id: string; name: string; args: string; done: boolean }
  | {
      kind: 'proposal';
      id: string;
      rationale: string;
      status: ProposalStatus;
      /** Still arriving: the run that made it has not finished. */
      held: boolean;
      change: CodeChange | ConfigurationChange;
    };

/**
 * The Assistant tab's conversation, kept outside the tab so that it survives
 * the tab unmounting and a reload, and tied to the project it is about. The
 * thread itself lives on the agent; `threadId` is how the next message finds
 * it.
 */
type AssistantState = {
  threadId: string;
  items: Item[];
  busy: boolean;
  /** The saved project the conversation is about; null for an unsaved one. */
  project: string | null;
};

type AssistantActions = {
  setItems: (change: (items: Item[]) => Item[]) => void;
  setBusy: (busy: boolean) => void;
  /** A new conversation about the same project. */
  reset: () => void;
  /** The project changed: a new conversation, unless it is this one's. */
  forProject: (project: string | null) => void;
  /** The project was saved: the conversation is now about it. */
  adopt: (project: string) => void;
};

const fresh = () => ({ threadId: crypto.randomUUID(), items: [] });

export const useAssistantStore = create<AssistantState & AssistantActions>()(
  persist(
    (set, get) => ({
      ...fresh(),
      busy: false,
      project: null,
      setItems: (change) => set((state) => ({ items: change(state.items) })),
      setBusy: (busy) => set({ busy }),
      reset: () => set(fresh()),
      forProject: (project) => {
        if (project !== null && get().project === project) return;
        set({ ...fresh(), project });
      },
      adopt: (project) => set({ project })
    }),
    {
      name: 'openeo-assistant-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        threadId: state.threadId,
        items: state.items,
        project: state.project
      })
    }
  )
);
