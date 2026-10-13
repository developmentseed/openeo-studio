import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BandArrayBuilder } from '$components/editor/setup/band-array-builder';
import type { BandVariable } from '$types';

const availableBands: BandVariable[] = [
  { name: 'reflectance|bands=b02', label: 'Blue', commonName: 'blue' },
  { name: 'reflectance|bands=b04', label: 'Red', commonName: 'red' }
];

describe('BandArrayBuilder', () => {
  it('keeps raw and common name references as written', () => {
    const onSelectionChange = jest.fn();
    render(
      <ChakraProvider value={defaultSystem}>
        <BandArrayBuilder
          availableBands={availableBands}
          selectedBands={['red', 'b02']}
          onSelectionChange={onSelectionChange}
        />
      </ChakraProvider>
    );

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByText('red')).toBeInTheDocument();
    expect(screen.getByText('b02')).toBeInTheDocument();
    expect(screen.getByText('All bands selected')).toBeInTheDocument();
  });

  it('drops a reference that the collection cannot resolve', () => {
    const onSelectionChange = jest.fn();
    render(
      <ChakraProvider value={defaultSystem}>
        <BandArrayBuilder
          availableBands={availableBands}
          selectedBands={['red', 'B08']}
          onSelectionChange={onSelectionChange}
        />
      </ChakraProvider>
    );

    expect(onSelectionChange).toHaveBeenCalledWith(['red']);
  });
});
