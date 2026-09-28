import { render } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { BandArrayBuilder } from '$components/editor/setup/band-array-builder';

describe('BandArrayBuilder', () => {
  it('maps legacy selections to the advertised "bands=" spelling', () => {
    const onSelectionChange = jest.fn();
    render(
      <ChakraProvider value={defaultSystem}>
        <BandArrayBuilder
          availableBands={[
            { name: 'reflectance|bands=b04', label: 'Red' },
            { name: 'reflectance|bands=b03', label: 'Green' }
          ]}
          selectedBands={['reflectance|b04', 'reflectance|b03']}
          onSelectionChange={onSelectionChange}
        />
      </ChakraProvider>
    );

    expect(onSelectionChange).toHaveBeenCalledWith([
      'reflectance|bands=b04',
      'reflectance|bands=b03'
    ]);
  });
});
