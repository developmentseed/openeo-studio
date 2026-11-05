jest.mock('$config/runtime', () => ({
  appConfig: { openeoApiUrl: 'https://example.test/openeo', basemaps: '' }
}));
// The real header needs auth and theme context; a stand-in with a "New
// project" button is enough to navigate to the same path.
jest.mock('$components/layout/app-header', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useNavigate } = require('react-router');
  return {
    AppHeader: () => {
      const navigate = useNavigate();
      return <button onClick={() => navigate('/editor')}>New project</button>;
    }
  };
});

import { TextEncoder } from 'util';
import type * as ReactRouter from 'react-router';
import type * as Boundary from '$pages/uhoh/boundary';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

import { NotFound } from '$utils/errors';

// react-router needs TextEncoder, which jsdom lacks; load it afterwards.
Object.assign(global, { TextEncoder });
/* eslint-disable @typescript-eslint/no-require-imports */
const { BrowserRouter, useLocation } =
  require('react-router') as typeof ReactRouter;
const ErrorBoundary = (require('$pages/uhoh/boundary') as typeof Boundary)
  .default;
/* eslint-enable @typescript-eslint/no-require-imports */

function Editor() {
  const message = (useLocation().state as { notFound?: string })?.notFound;
  if (message) throw new NotFound(message);
  return <p>editor ok</p>;
}

function renderAtIncompatibleEditor() {
  window.history.replaceState(
    {
      usr: {
        notFound:
          "This project isn't compatible with the connected backend: no B04"
      },
      key: 'k1',
      idx: 0
    },
    '',
    '/editor'
  );
  return render(
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <ErrorBoundary>
          <Editor />
        </ErrorBoundary>
      </BrowserRouter>
    </ChakraProvider>
  );
}

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('ErrorBoundary with a project that could not open', () => {
  it('shows the reason', () => {
    renderAtIncompatibleEditor();
    expect(
      screen.getByText(
        "This project isn't compatible with the connected backend: no B04"
      )
    ).toBeInTheDocument();
  });

  it('recovers when navigating to the same path', async () => {
    renderAtIncompatibleEditor();
    await userEvent.click(screen.getByRole('button', { name: 'New project' }));
    expect(screen.getByText('editor ok')).toBeInTheDocument();
  });

  it('forgets the reason so a reload shows the editor', () => {
    renderAtIncompatibleEditor();
    expect(window.history.state?.usr?.notFound).toBeUndefined();
  });
});
