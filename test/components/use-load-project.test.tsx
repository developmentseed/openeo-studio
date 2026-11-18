const mockLoad = jest.fn();
const mockNavigate = jest.fn();

jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));
jest.mock('$config/catalogue', () => ({ catalogue: { load: mockLoad } }));
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ user: { access_token: 'tok' } })
}));
jest.mock('react-router', () => ({ useNavigate: () => mockNavigate }));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import { useLoadProject } from '$components/editor/use-load-project';
import { useEditorStore } from '$stores/editor-store';

const seed = {
  name: 'Saved',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-01-01', '2025-01-02'] as [string, string],
  cloudCover: 10,
  bands: [],
  suggestedAlgorithm: 'print("saved")'
};

function Host({ projectId }: { projectId: string }) {
  const { isLoading, dialog } = useLoadProject(projectId);
  return (
    <>
      <p>{isLoading ? 'loading' : 'idle'}</p>
      {dialog}
    </>
  );
}

const renderHost = (projectId = 'p1') =>
  render(
    <ChakraProvider value={defaultSystem}>
      <Host projectId={projectId} />
    </ChakraProvider>
  );

const store = () => useEditorStore.getState();

beforeEach(() => {
  mockLoad.mockReset();
  mockNavigate.mockReset();
  mockLoad.mockResolvedValue({ seed, projectId: 'p1', autoRun: true });
  store().clearEditor();
});

describe('useLoadProject', () => {
  it('loads the saved project when nothing is unsaved', async () => {
    renderHost();
    await waitFor(() => expect(store().sceneId).toBe('p1'));
    expect(store().code).toBe('print("saved")');
    expect(store().autoRun).toBe(true);
  });

  it('asks before replacing unsaved work, and goes back on cancel', async () => {
    store().setCode('my work');
    renderHost();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Cancel' })
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/editor', { replace: true })
    );
    expect(store().code).toBe('my work');
    expect(store().sceneId).toBeNull();
  });

  it('replaces unsaved work when the user discards it', async () => {
    store().setCode('my work');
    renderHost();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Discard' })
    );

    await waitFor(() => expect(store().sceneId).toBe('p1'));
    expect(store().code).toBe('print("saved")');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
