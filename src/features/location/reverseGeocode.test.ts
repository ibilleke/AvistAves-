import * as Location from 'expo-location';

import { reverseGeocode } from './reverseGeocode';

jest.mock('expo-location', () => ({
  reverseGeocodeAsync: jest.fn(),
}));

const reverseGeocodeAsync = Location.reverseGeocodeAsync as jest.Mock;

describe('reverseGeocode', () => {
  afterEach(() => {
    reverseGeocodeAsync.mockReset();
  });

  it('joins street, city and region into a readable address', async () => {
    reverseGeocodeAsync.mockResolvedValue([
      {
        street: 'Av. Providencia',
        streetNumber: '1234',
        city: 'Santiago',
        region: 'Región Metropolitana',
      },
    ]);

    const result = await reverseGeocode(-33.42, -70.61);

    expect(result).toBe('Av. Providencia 1234, Santiago, Región Metropolitana');
  });

  it('omits missing fields instead of leaving gaps', async () => {
    reverseGeocodeAsync.mockResolvedValue([
      { street: null, streetNumber: null, city: 'Valparaíso', region: null },
    ]);

    const result = await reverseGeocode(-33.04, -71.62);

    expect(result).toBe('Valparaíso');
  });

  it('returns undefined when there is no address result', async () => {
    reverseGeocodeAsync.mockResolvedValue([]);

    expect(await reverseGeocode(0, 0)).toBeUndefined();
  });

  it('returns undefined when every field is empty', async () => {
    reverseGeocodeAsync.mockResolvedValue([
      { street: null, streetNumber: null, city: null, region: null },
    ]);

    expect(await reverseGeocode(0, 0)).toBeUndefined();
  });

  it('returns undefined instead of throwing when the native call fails', async () => {
    reverseGeocodeAsync.mockRejectedValue(new Error('boom'));

    expect(await reverseGeocode(0, 0)).toBeUndefined();
  });
});
