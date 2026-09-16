import { mapWeatherCode } from './weather.mapper';

describe('mapWeatherCode', () => {
  it('maps known WMO codes to a readable description and icon', () => {
    expect(mapWeatherCode(0)).toEqual({ description: 'Despejado', icon: '☀️' });
    expect(mapWeatherCode(61)).toEqual({ description: 'Lluvia débil', icon: '🌧️' });
    expect(mapWeatherCode(95)).toEqual({ description: 'Tormenta eléctrica', icon: '⛈️' });
  });

  it('falls back to a generic description for unknown codes', () => {
    expect(mapWeatherCode(9999)).toEqual({
      description: 'Condición desconocida',
      icon: '❔',
    });
  });

  it('never returns the raw numeric code as the description', () => {
    for (const code of [0, 45, 61, 71, 80, 95]) {
      const { description } = mapWeatherCode(code);
      expect(description).not.toMatch(/^\d+$/);
    }
  });
});
