export type BirdSighting = {
  id: string; // uuid
  birdName: string; // texto libre; acepta "no identificada"
  count: number; // cantidad de ejemplares, mínimo 1
  notes?: string;
  photoUri: string; // uri local de la foto (filesystem del dispositivo)
  observedAt: string; // ISO date — automática al abrir el formulario, editable
  location: {
    latitude: number;
    longitude: number;
    placeName?: string; // resultado de reverseGeocodeAsync; undefined si falló
  };
  weather?: {
    // ausente si Open-Meteo falló o no había red
    temperatureC: number;
    relativeHumidity: number; // tercer dato elegido (RF-02)
    weatherCode: number; // código crudo de Open-Meteo
    description: string; // mapeado desde weatherCode
    icon: string; // ícono/emoji mapeado desde weatherCode
  };
  createdAt: string; // ISO date — momento real de guardado (para ordenar)
};
