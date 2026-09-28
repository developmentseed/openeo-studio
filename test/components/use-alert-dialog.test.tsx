import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { useAlertDialog } from '$components/common/use-alert-dialog';

function Host() {
  const { alert, dialog } = useAlertDialog();
  const [result, setResult] = useState('idle');

  return (
    <>
      <button
        type='button'
        onClick={() => {
          void alert({
            title: 'Nothing to save',
            body: <p>No layers</p>,
            okLabel: 'Got it'
          }).then(() => {
            setResult('dismissed');
          });
        }}
      >
        Ask
      </button>
      <div data-testid='result'>{result}</div>
      {dialog}
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

describe('useAlertDialog', () => {
  it('resolves when the ok button is clicked', async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(
      screen.getByRole('heading', { name: 'Nothing to save' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.getByTestId('result')).toHaveTextContent('dismissed');
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Nothing to save' })
      ).not.toBeInTheDocument();
    });
  });
});
