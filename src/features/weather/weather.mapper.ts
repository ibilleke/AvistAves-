export type WeatherDescription = {
  description: string;
  icon: string;
};

// Tabla de códigos WMO usada por Open-Meteo:
// https://open-meteo.com/en/docs (sección "WMO Weather interpretation codes")
const WEATHER_CODE_MAP: Record<number, WeatherDescription> = {
  0: { description: 'Despejado', icon: '☀️' },
  1: { description: 'Mayormente despejado', icon: '🌤️' },
  2: { description: 'Parcialmente nublado', icon: '⛅' },
  3: { description: 'Nublado', icon: '☁️' },
  45: { description: 'Niebla', icon: '🌫️' },
  48: { description: 'Niebla con escarcha', icon: '🌫️' },
  51: { description: 'Llovizna débil', icon: '🌦️' },
  53: { description: 'Llovizna moderada', icon: '🌦️' },
  55: { description: 'Llovizna intensa', icon: '🌧️' },
  56: { description: 'Llovizna helada débil', icon: '🌧️' },
  57: { description: 'Llovizna helada intensa', icon: '🌧️' },
  61: { description: 'Lluvia débil', icon: '🌧️' },
  63: { description: 'Lluvia moderada', icon: '🌧️' },
  65: { description: 'Lluvia intensa', icon: '🌧️' },
  66: { description: 'Lluvia helada débil', icon: '🌧️' },
  67: { description: 'Lluvia helada intensa', icon: '🌧️' },
  71: { description: 'Nevada débil', icon: '🌨️' },
  73: { description: 'Nevada moderada', icon: '🌨️' },
  75: { description: 'Nevada intensa', icon: '❄️' },
  77: { description: 'Granizo pequeño', icon: '🌨️' },
  80: { description: 'Chubascos débiles', icon: '🌦️' },
  81: { description: 'Chubascos moderados', icon: '🌦️' },
  82: { description: 'Chubascos violentos', icon: '⛈️' },
  85: { description: 'Chubascos de nieve débiles', icon: '🌨️' },
  86: { description: 'Chubascos de nieve intensos', icon: '❄️' },
  95: { description: 'Tormenta eléctrica', icon: '⛈️' },
  96: { description: 'Tormenta con granizo débil', icon: '⛈️' },
  99: { description: 'Tormenta con granizo intenso', icon: '⛈️' },
};

export function mapWeatherCode(code: number): WeatherDescription {
  return WEATHER_CODE_MAP[code] ?? { description: 'Condición desconocida', icon: '❔' };
}
