import { fetchCurrentWeather } from './openMeteo.client';

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response;
}

function openMeteoBody(overrides: Partial<{
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
}> = {}) {
  return {
    current: {
      temperature_2m: 18.4,
      relative_humidity_2m: 55,
      weather_code: 0,
      ...overrides,
    },
  };
}

describe('fetchCurrentWeather', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('maps a successful Open-Meteo response into BirdSighting["weather"]', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(openMeteoBody()));

    const weather = await fetchCurrentWeather(-10.111, -20.222);

    expect(weather).toEqual({
      temperatureC: 18.4,
      relativeHumidity: 55,
      weatherCode: 0,
      description: 'Despejado',
      icon: '☀️',
    });
  });

  it('includes the given coordinates in the request URL', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(openMeteoBody()));
    global.fetch = fetchMock;

    await fetchCurrentWeather(-33.45, -70.66);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('latitude=-33.45');
    expect(url).toContain('longitude=-70.66');
  });

  it('returns undefined when the API responds with a non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({}, false));

    const weather = await fetchCurrentWeather(-1.001, -2.001);

    expect(weather).toBeUndefined();
  });

  it('returns undefined instead of throwing when there is no network', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    const weather = await fetchCurrentWeather(-3.003, -4.004);

    expect(weather).toBeUndefined();
  });

  it('caches the result per rounded location and does not re-fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(openMeteoBody()));
    global.fetch = fetchMock;

    const coords: [number, number] = [-15.551, -25.551];
    await fetchCurrentWeather(...coords);
    await fetchCurrentWeather(...coords);
    // Misma ubicación redondeada a 2 decimales (-15.55, -25.55), aunque no sea
    // exactamente el mismo par de números.
    await fetchCurrentWeather(-15.554, -25.554);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not use the cache for a meaningfully different location', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(openMeteoBody()));
    global.fetch = fetchMock;

    await fetchCurrentWeather(10.0, 10.0);
    await fetchCurrentWeather(50.0, 50.0);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries once after a transient network failure and uses the second attempt', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce(jsonResponse(openMeteoBody({ temperature_2m: 12.5 })));
    global.fetch = fetchMock;

    const weather = await fetchCurrentWeather(-7.007, -8.008);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(weather?.temperatureC).toBe(12.5);
  });

  it('does not retry after an abort/timeout', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    const fetchMock = jest.fn().mockRejectedValue(abortError);
    global.fetch = fetchMock;

    const weather = await fetchCurrentWeather(-9.009, -11.011);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(weather).toBeUndefined();
  });
});
