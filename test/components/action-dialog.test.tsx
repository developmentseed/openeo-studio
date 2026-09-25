import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ActionDialog } from '$components/common/action-dialog';

function renderDialog(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('ActionDialog', () => {
  it('renders title, body, and actions slot', () => {
    renderDialog(
      <ActionDialog
        open
        title='Claim sample'
        onClose={() => {}}
        actions={<button type='button'>Confirm</button>}
      >
        <p>Will be added to your account</p>
      </ActionDialog>
    );

    expect(
      screen.getByRole('heading', { name: 'Claim sample' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Will be added to your account')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('calls onClose when the dismiss control is activated', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    renderDialog(
      <ActionDialog
        open
        title='Nothing to save'
        onClose={onClose}
        actions={
          <button type='button' onClick={onClose}>
            Got it
          </button>
        }
      >
        <p>No layers</p>
      </ActionDialog>
    );

    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(onClose).toHaveBeenCalled();
  });
});
