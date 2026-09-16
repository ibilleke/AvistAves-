import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'error';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export function useCurrentLocation() {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const fetchLocation = useCallback(async () => {
    setStatus('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);
      if (permission.status !== 'granted') {
        setStatus('denied');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { status, coords, canAskAgain, retry: fetchLocation };
}
