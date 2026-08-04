import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { useConfirmDialog } from '$components/common/use-confirm-dialog';

function Host() {
  const { confirm, dialog } = useConfirmDialog();
  const [result, setResult] = useState<string>('idle');

  return (
    <>
      <button
        type='button'
        onClick={() => {
          void confirm({
            title: 'Save to your account',
            body: <p>Will be added to your account</p>,
            confirmLabel: 'Save to account',
            cancelLabel: 'Cancel'
          }).then((confirmed) => {
            setResult(confirmed ? 'confirmed' : 'cancelled');
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

describe('useConfirmDialog', () => {
  it('resolves true when the confirm button is clicked', async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole('button', { name: 'Ask' }));
    expect(
      screen.getByRole('heading', { name: 'Save to your account' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save to account' }));
    expect(screen.getByTestId('result')).toHaveTextContent('confirmed');
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Save to your account' })
      ).not.toBeInTheDocument();
    });
  });

  it('resolves false when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderHost();

    await user.click(screen.getByRole('button', { name: 'Ask' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByTestId('result')).toHaveTextContent('cancelled');
  });
});
