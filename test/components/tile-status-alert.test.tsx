import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { TileStatusAlert } from '$components/map/tile-status-alert';
import type { TileLoadStatus } from '$components/map/use-map-tile-status';

const failed: TileLoadStatus = {
  pending: 0,
  status: 'error',
  failed: 2,
  error: {
    code: 'NoDataAvailable',
    message: 'No image.',
    advice: 'Use more dates.'
  }
};

const renderAlert = (onAsk?: () => void) =>
  render(
    <ChakraProvider value={defaultSystem}>
      <TileStatusAlert status={failed} onAsk={onAsk} />
    </ChakraProvider>
  );

it('offers to ask the assistant about a tile error', async () => {
  const onAsk = jest.fn();
  renderAlert(onAsk);
  expect(screen.getByText(/2 tiles failed/)).toBeTruthy();

  await userEvent.click(
    screen.getByRole('button', { name: 'Ask the assistant' })
  );
  expect(onAsk).toHaveBeenCalledTimes(1);
});

it('has no button when no assistant is configured', () => {
  renderAlert();
  expect(
    screen.queryByRole('button', { name: 'Ask the assistant' })
  ).toBeNull();
});
