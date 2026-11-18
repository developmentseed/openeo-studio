import { act, render } from '@testing-library/react';

import { MapViewer } from '$components/map/map-viewer';

type Box = [number, number, number, number];

const mockMap = {
  fitBounds: jest.fn(),
  view: [0, 0, 1, 1] as number[],
  onMoveEnd: undefined as
    | ((event: { originalEvent?: unknown }) => void)
    | undefined
};

// A map that records fitBounds, and lets the test pan it as a user would.
jest.mock('react-map-gl/maplibre', () => {
  const { forwardRef, useEffect, useImperativeHandle } = jest.requireActual<
    typeof import('react')
  >('react');
  return {
    __esModule: true,
    default: forwardRef(function FakeMap(
      props: {
        onLoad: () => void;
        onMoveEnd: (event: { originalEvent?: unknown }) => void;
      },
      ref
    ) {
      useImperativeHandle(ref, () => ({
        fitBounds: mockMap.fitBounds,
        getBounds: () => ({
          getWest: () => mockMap.view[0],
          getSouth: () => mockMap.view[1],
          getEast: () => mockMap.view[2],
          getNorth: () => mockMap.view[3]
        }),
        on: () => {},
        off: () => {}
      }));
      mockMap.onMoveEnd = props.onMoveEnd;
      useEffect(() => props.onLoad(), []);
      return null;
    })
  };
});
jest.mock('$config/constants', () => ({
  BASE_LAYERS: [{ id: 'base', style: { light: '', dark: '' } }]
}));
jest.mock('$components/map/map-layers', () => ({ MapLayers: () => null }));
jest.mock('$components/map/map-layer-selector', () => ({
  MapLayerSelector: () => null
}));
jest.mock('$contexts/color-mode', () => ({
  useColorModeValue: (light: unknown) => light
}));

function setup(bounds: Box) {
  const onBoundingBoxChange = jest.fn();
  const view = (next: Box) => (
    <MapViewer
      bounds={next}
      sceneId='scene'
      services={[]}
      onToggleLayer={() => {}}
      onBoundingBoxChange={onBoundingBoxChange}
    />
  );
  const { rerender } = render(view(bounds));
  mockMap.fitBounds.mockClear();
  return {
    onBoundingBoxChange,
    setBounds: (next: Box) => rerender(view(next))
  };
}

describe('MapViewer', () => {
  it('fits the map to an area set from outside the map', () => {
    const { setBounds } = setup([0, 0, 1, 1]);

    setBounds([-1.26, 44.66, -0.78, 45.02]);

    expect(mockMap.fitBounds).toHaveBeenCalledWith(
      [-1.26, 44.66, -0.78, 45.02],
      expect.anything()
    );
  });

  it('does not move the map to the area that the user panned to', () => {
    const { onBoundingBoxChange, setBounds } = setup([0, 0, 1, 1]);

    mockMap.view = [2, 2, 3, 3];
    act(() => mockMap.onMoveEnd?.({ originalEvent: {} }));
    setBounds([2, 2, 3, 3]);

    expect(onBoundingBoxChange).toHaveBeenCalledWith([2, 2, 3, 3]);
    expect(mockMap.fitBounds).not.toHaveBeenCalled();
  });
});
