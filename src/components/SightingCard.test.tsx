import { fireEvent, render, screen } from '@testing-library/react-native';

import { SightingCard } from './SightingCard';
import type { BirdSighting } from '../features/sightings/types';

function makeSighting(overrides: Partial<BirdSighting> = {}): BirdSighting {
  return {
    id: '1',
    birdName: 'Zorzal',
    count: 2,
    photoUri: 'mock://sin-foto',
    observedAt: '2026-01-05T10:00:00.000Z',
    location: { latitude: -33.45, longitude: -70.66 },
    createdAt: '2026-01-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('SightingCard', () => {
  it('shows the bird name', async () => {
    await render(<SightingCard sighting={makeSighting()} onPress={() => {}} />);
    expect(screen.getByText('Zorzal')).toBeTruthy();
  });

  it('shows "sin clima" when there is no weather data', async () => {
    await render(
      <SightingCard sighting={makeSighting({ weather: undefined })} onPress={() => {}} />,
    );
    expect(screen.getByText('sin clima')).toBeTruthy();
  });

  it('shows the rounded temperature when weather data is present', async () => {
    await render(
      <SightingCard
        sighting={makeSighting({
          weather: {
            temperatureC: 18.6,
            relativeHumidity: 50,
            weatherCode: 0,
            description: 'Despejado',
            icon: '☀️',
          },
        })}
        onPress={() => {}}
      />,
    );
    expect(screen.getByText('19°C')).toBeTruthy();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<SightingCard sighting={makeSighting()} onPress={onPress} />);

    await fireEvent.press(screen.getByText('Zorzal'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
