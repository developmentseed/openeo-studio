jest.mock('@developmentseed/stac-react', () => ({
  useCollection: () => ({ collection: undefined, isLoading: false })
}));

import { TextEncoder } from 'util';
Object.assign(global, { TextEncoder });

import { fireEvent, render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MemoryRouter, Route, Routes } = require('react-router');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SceneCard } = require('$pages/projects/scene-card');

function renderCard(props: { href?: string; onOpen: () => void }) {
  render(
    <ChakraProvider value={defaultSystem}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path='/'
            element={<SceneCard name='FAPAR' description='' {...props} />}
          />
          <Route path='/editor' element={<p>editor page</p>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe('SceneCard', () => {
  it('is a link to its href, opened in place on a plain click', () => {
    const onOpen = jest.fn();
    renderCard({ href: '/editor?project_url=x', onOpen });

    const link = screen.getByRole('link', { name: 'FAPAR' });
    expect(link).toHaveAttribute('href', '/editor?project_url=x');

    fireEvent.click(link);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('editor page')).not.toBeInTheDocument();
  });

  it('leaves a modified click to the browser', () => {
    const onOpen = jest.fn();
    renderCard({ href: '/editor?project_url=x', onOpen });

    fireEvent.click(screen.getByRole('link', { name: 'FAPAR' }), {
      metaKey: true
    });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('is a button without an href', () => {
    const onOpen = jest.fn();
    renderCard({ onOpen });

    fireEvent.click(screen.getByRole('button', { name: 'FAPAR' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
