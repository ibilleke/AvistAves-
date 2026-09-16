import { mapWeatherCode } from './weather.mapper';
import type { BirdSighting } from '../sightings/types';

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
};

const REQUEST_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = {
  value: BirdSighting['weather'] | undefined;
  expiresAt: number;
};

// Cache en memoria por ubicación redondeada (~1.1km), evita repetir la
// consulta si el usuario reintenta el guardado desde el mismo lugar.
const cache = new Map<string, CacheEntry>();

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<BirdSighting['weather'] | undefined> {
  const key = cacheKey(latitude, longitude);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      cache.set(key, { value: undefined, expiresAt: Date.now() + CACHE_TTL_MS });
      return undefined;
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const { description, icon } = mapWeatherCode(data.current.weather_code);

    const weather: BirdSighting['weather'] = {
      temperatureC: data.current.temperature_2m,
      relativeHumidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      description,
      icon,
    };

    cache.set(key, { value: weather, expiresAt: Date.now() + CACHE_TTL_MS });
    return weather;
  } catch {
    // Timeout (AbortController) o sin red: se guarda el avistamiento sin
    // clima en vez de bloquear el flujo o reintentar indefinidamente.
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}
