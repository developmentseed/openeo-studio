const mockLoad = jest.fn();
const mockNavigate = jest.fn();
const mockToastError = jest.fn();

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));
jest.mock('$config/catalogue', () => ({ catalogue: { load: mockLoad } }));
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { access_token: 'tok' } })
}));
jest.mock('react-router', () => ({ useNavigate: () => mockNavigate }));
jest.mock('$utils/toaster', () => ({
  toaster: { error: (...args: unknown[]) => mockToastError(...args) }
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import {
  useNewProject,
  useOpenEntry
} from '$components/catalogue/use-open-entry';
import { useEditorStore } from '$stores/editor-store';
import { IncompatibleProjectError } from '$utils/catalogue/catalogue';
import { APIError } from '$utils/api';
import { NotFound } from '$utils/errors';

const seed = {
  name: 'Loaded',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-01-01', '2025-01-02'] as [string, string],
  propertyFilters: [],
  bands: ['B04'],
  suggestedAlgorithm: 'print("loaded")'
};

function Host() {
  const { openEntry, dialog } = useOpenEntry();
  const { newProject, dialog: newDialog } = useNewProject();
  return (
    <>
      <button onClick={() => openEntry({ loader: 'l', ref: 'r' })}>Open</button>
      <button onClick={() => openEntry({ loader: 'l', ref: 'r2' })}>
        Open other
      </button>
      <button
        onClick={() =>
          openEntry(
            { loader: 'l', ref: 'r' },
            { replace: true, fromLink: true }
          )
        }
      >
        Open link
      </button>
      <button onClick={() => newProject()}>New</button>
      {dialog}
      {newDialog}
    </>
  );
}

function renderHost() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <Host />
    </ChakraProvider>
  );
}

const store = () => useEditorStore.getState();

beforeEach(() => {
  mockLoad.mockReset();
  mockNavigate.mockReset();
  mockToastError.mockReset();
  store().clearEditor();
});

describe('useOpenEntry', () => {
  it('loads, hydrates and opens the editor when nothing is unsaved', async () => {
    mockLoad.mockResolvedValue({ seed, autoRun: false });
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/editor', { replace: false })
    );
    expect(mockLoad).toHaveBeenCalledWith(
      { loader: 'l', ref: 'r' },
      { authToken: 'tok', signal: expect.any(AbortSignal) }
    );
    expect(store().code).toBe('print("loaded")');
    expect(store().sceneId).toBeNull();
    expect(store().autoRun).toBe(false);
  });

  it('opens a saved project at its own URL', async () => {
    mockLoad.mockResolvedValue({ seed, projectId: 'p1', autoRun: true });
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/editor/p1', {
        replace: false
      })
    );
    expect(store().sceneId).toBe('p1');
    expect(store().autoRun).toBe(true);
  });

  it('leaves unsaved work alone when the user cancels', async () => {
    mockLoad.mockResolvedValue({ seed, autoRun: false });
    store().setCode('my work');
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('heading', { name: 'Discard unsaved changes?' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Discard unsaved changes?' })
      ).not.toBeInTheDocument()
    );
    expect(store().code).toBe('my work');
    expect(store().isDirty).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('replaces unsaved work when the user discards it', async () => {
    mockLoad.mockResolvedValue({ seed, autoRun: false });
    store().setCode('my work');
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard' })
    );

    await waitFor(() => expect(store().code).toBe('print("loaded")'));
    expect(mockNavigate).toHaveBeenCalledWith('/editor', { replace: false });
  });

  it('shows the incompatible view without touching the editor', async () => {
    mockLoad.mockRejectedValue(new IncompatibleProjectError('no B04'));
    store().setCode('my work');
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/editor', {
        replace: false,
        state: {
          notFound:
            "This project isn't compatible with the connected backend: no B04"
        }
      })
    );
    expect(store().code).toBe('my work');
  });

  it('cancels an earlier load when another entry opens', async () => {
    let firstSignal: AbortSignal | undefined;
    mockLoad.mockImplementation(({ ref }, { signal }) => {
      if (ref === 'r2') return Promise.resolve({ seed, autoRun: false });
      firstSignal = signal;
      return new Promise((_, reject) =>
        signal.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError'))
        )
      );
    });
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open other' }));

    await waitFor(() => expect(store().code).toBe('print("loaded")'));
    expect(firstSignal?.aborted).toBe(true);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it.each([
    ['a missing entry', new NotFound('Sample not found: r')],
    ['a 404 response', new APIError('Failed to fetch r: 404', 404, '')]
  ])('shows the 404 page for %s opened from a link', async (_, error) => {
    mockLoad.mockRejectedValue(error);
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open link' }));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/editor', {
        replace: true,
        state: { notFound: error.message }
      })
    );
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('shows a toast for a missing entry opened by a click', async () => {
    mockLoad.mockRejectedValue(new NotFound('Sample not found: r'));
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a toast when loading fails', async () => {
    mockLoad.mockRejectedValue(new Error('Failed to fetch x: 404'));
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith({
        title: "Couldn't open project",
        description: 'Failed to fetch x: 404'
      })
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store().code).toBe('');
  });
});

describe('useNewProject', () => {
  it('keeps unsaved work when the user cancels', async () => {
    store().setCode('my work');
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'New' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Discard unsaved changes?' })
      ).not.toBeInTheDocument()
    );
    expect(store().code).toBe('my work');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('clears the editor and opens it', async () => {
    store().hydrateFromScene('p1', seed, true);
    renderHost();

    await userEvent.click(screen.getByRole('button', { name: 'New' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/editor'));
    expect(store().code).toBe('');
    expect(store().sceneId).toBeNull();
  });
});
