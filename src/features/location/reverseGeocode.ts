import * as Location from 'expo-location';

export async function reverseGeocode(latitude: number, longitude: number): Promise<string | undefined> {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!address) return undefined;

    const street = [address.street, address.streetNumber].filter(Boolean).join(' ');
    const parts = [street, address.city, address.region].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : undefined;
  } catch {
    return undefined;
  }
}
