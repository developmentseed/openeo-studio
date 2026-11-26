jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo' }
}));

import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import { LoadNoticeAlert } from '$components/editor/load-notice-alert';
import { useEditorStore } from '$stores/editor-store';

const seed = {
  name: 'Max NDVI',
  collectionId: 'sentinel-2-l2a',
  temporalRange: ['2025-01-01', '2025-01-02'] as [string, string],
  propertyFilters: [],
  bands: ['B04'],
  suggestedAlgorithm: 'print("x")'
};

function renderAlert(notice: Parameters<typeof hydrate>[0]) {
  hydrate(notice);
  render(
    <ChakraProvider value={defaultSystem}>
      <LoadNoticeAlert />
    </ChakraProvider>
  );
}

function hydrate(notice: {
  generated?: boolean;
  incompatibilities?: string[];
}) {
  useEditorStore.getState().hydrateFromScene(null, seed, false, notice);
}

describe('LoadNoticeAlert', () => {
  it('warns that generated code may not work, and lists what to check', () => {
    renderAlert({
      generated: true,
      incompatibilities: ['Process "ndvi" is not available on this backend.']
    });

    expect(screen.getByText('This code was generated from a UDP')).toBeTruthy();
    expect(screen.getByText(/may not work/)).toBeTruthy();
    expect(
      screen.getByText('Process "ndvi" is not available on this backend.')
    ).toBeTruthy();
    expect(screen.queryByText(/loaded unchanged/)).toBeNull();
  });

  it('warns about generated code that has nothing else to check', () => {
    renderAlert({ generated: true });

    expect(screen.getByText('This code was generated from a UDP')).toBeTruthy();
  });

  it('keeps the wording for a project that was not generated', () => {
    renderAlert({ incompatibilities: ['Band "x" is not available in "c".'] });

    expect(screen.queryByText(/generated from a UDP/)).toBeNull();
    expect(screen.getByText(/loaded unchanged/)).toBeTruthy();
  });
});
