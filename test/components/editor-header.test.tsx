jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({ isAuthenticated: true })
}));
jest.mock('$components/editor/editor-options-menu', () => ({
  EditorOptionsMenu: () => null
}));

import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem, Tabs } from '@chakra-ui/react';

import { EditorHeader } from '$components/editor/editor-header';
import { useEditorStore } from '$stores/editor-store';

const seed = {
  name: 'FAPAR',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-01-01', '2025-01-02'] as [string, string],
  cloudCover: 100,
  defaultBands: ['B04'],
  suggestedAlgorithm: 'print("x")'
};

function renderHeader() {
  render(
    <ChakraProvider value={defaultSystem}>
      <Tabs.Root>
        <EditorHeader
          onExecuteClick={() => {}}
          isExecuting={false}
          isReady
          hasPendingChanges={useEditorStore.getState().isDirty}
          onDeleteClick={() => {}}
          isDeleteBusy={false}
          isDeleteDisabled
        />
      </Tabs.Root>
    </ChakraProvider>
  );
  return screen.getByRole('button', { name: /save/i });
}

describe('EditorHeader save button', () => {
  it('can save a loaded project that was never saved', () => {
    useEditorStore.getState().hydrateFromScene(null, seed, false);
    expect(renderHeader()).toBeEnabled();
  });

  it('stays disabled for an empty new project', () => {
    useEditorStore.getState().clearEditor();
    expect(renderHeader()).toBeDisabled();
  });

  it('stays disabled for an unchanged saved project', () => {
    useEditorStore.getState().hydrateFromScene('p1', seed, true);
    expect(renderHeader()).toBeDisabled();
  });
});
