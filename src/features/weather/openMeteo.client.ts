import { mapWeatherCode } from './weather.mapper';
import type { BirdSighting } from '../sightings/types';

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
};

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<BirdSighting['weather'] | undefined> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;

    const response = await fetch(url);
    if (!response.ok) return undefined;

    const data = (await response.json()) as OpenMeteoResponse;
    const { description, icon } = mapWeatherCode(data.current.weather_code);

    return {
      temperatureC: data.current.temperature_2m,
      relativeHumidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      description,
      icon,
    };
  } catch {
    return undefined;
  }
}
