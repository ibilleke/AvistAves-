import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows a message inviting the user to create the first sighting', async () => {
    await render(<EmptyState onCreate={() => {}} />);

    expect(
      screen.getByText('Todavía no registraste ningún avistamiento'),
    ).toBeTruthy();
  });

  it('calls onCreate when the button is pressed', async () => {
    const onCreate = jest.fn();
    await render(<EmptyState onCreate={onCreate} />);

    await fireEvent.press(screen.getByText('Nuevo avistamiento'));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
