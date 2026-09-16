# Stack y Arquitectura — AvistAves

Este documento define la arquitectura técnica para implementar `docs/BRIEF.md`,
que a su vez sigue el enunciado oficial (`docs/enunciado-examen-avistaves.pdf`).

## 1. Stack tecnológico

| Capa                | Tecnología                          |
|---------------------|--------------------------------------|
| Framework           | React Native + Expo                  |
| Lenguaje            | TypeScript                           |
| Navegación          | Expo Router (file-based routing)     |
| Estilos             | NativeWind (Tailwind para RN)        |
| Cámara              | expo-camera                          |
| Ubicación           | expo-location                        |
| Persistencia local  | AsyncStorage                         |
| Clima               | Open-Meteo API (REST, sin API key)   |
| Entorno de desarrollo/pruebas | Expo Go SDK 54                 |
| Gestor de paquetes | pnpm                                    |

La app se desarrolla y prueba usando **Expo Go (SDK 54)**, lo que permite
correr la app en un dispositivo físico o emulador escaneando el QR de
`expo start`, sin necesidad de generar builds nativos durante el
desarrollo. Las dependencias nativas (`expo-camera`, `expo-location`, etc.)
deben mantenerse en las versiones compatibles con SDK 54.

## 2. Alcance: app de un solo usuario, sin backend

El enunciado pide una bitácora individual para uso en terreno. **No se
pide** multi-usuario, feed comunitario ni perfiles: todo el almacenamiento
es local al dispositivo, sin noción de autoría ni sincronización. No
introducir esos conceptos evita trabajo fuera del alcance evaluado.

## 3. Estructura de carpetas (Expo Router)

```
app/
  _layout.tsx                # Layout raíz (providers, tema)
  index.tsx                  # Listado (RF-03) — pantalla principal
  new-record.tsx             # Formulario de nuevo avistamiento (RF-01)
  record/
    [id].tsx                 # Detalle de un avistamiento (RF-04)

src/
  components/                # Componentes UI reutilizables
    SightingCard.tsx
    EmptyState.tsx
    WeatherBadge.tsx
  features/
    sightings/
      types.ts                     # BirdSighting
      sightings.repository.ts      # Acceso a datos (AsyncStorage)
      sightings.hooks.ts           # useSightings, useCreateSighting, etc.
    weather/
      openMeteo.client.ts          # Cliente HTTP a Open-Meteo (con timeout/caché)
      weather.mapper.ts            # Mapeo de weather_code a texto/ícono
    location/
      reverseGeocode.ts            # Wrapper sobre expo-location reverseGeocodeAsync
  lib/
    storage.ts                  # Wrapper tipado sobre AsyncStorage
    camera.ts                   # Helpers de captura/guardado de foto
  constants/
    theme.ts
```

## 4. Modelo de datos

```ts
type BirdSighting = {
  id: string;                 // uuid
  birdName: string;           // texto libre; acepta "no identificada"
  count: number;               // cantidad de ejemplares, mínimo 1
  notes?: string;
  photoUri: string;            // uri local de la foto (filesystem del dispositivo)
  observedAt: string;          // ISO date — automática al abrir el formulario, editable
  location: {
    latitude: number;
    longitude: number;
    placeName?: string;        // resultado de reverseGeocodeAsync; undefined si falló
  };
  weather?: {                  // ausente si Open-Meteo falló o no había red
    temperatureC: number;
    relativeHumidity: number;  // tercer dato elegido (RF-02)
    weatherCode: number;       // código crudo de Open-Meteo
    description: string;       // mapeado desde weatherCode
    icon: string;               // ícono/emoji mapeado desde weatherCode
  };
  createdAt: string;           // ISO date — momento real de guardado (para ordenar)
};
```

Notas:

- `observedAt` es distinto de `createdAt`: `observedAt` es la fecha/hora del
  avistamiento (editable por el usuario, RF-01), `createdAt` es cuándo se
  guardó el registro (para el orden "más reciente primero" de RF-03 aunque
  el usuario edite `observedAt`).
- `weather` es opcional a nivel de tipo: si la consulta falla, el registro
  se guarda sin ese campo (nunca bloquea el guardado).

## 5. Persistencia (AsyncStorage)

Clave propuesta:

- `@avistaves/sightings` → `BirdSighting[]`.

Se accede siempre a través de `sightings.repository.ts`, que expone:

- `getAll(): Promise<BirdSighting[]>` — ordenado por `createdAt` desc.
- `create(sighting: BirdSighting): Promise<void>`
- `getById(id: string): Promise<BirdSighting | undefined>`

Este patrón repositorio aísla el resto de la app de AsyncStorage y es uno
de los patrones de diseño a documentar en el informe (Repository).

## 6. Flujo de creación de un avistamiento (RF-01 + RF-02)

1. Usuario presiona "Nuevo avistamiento" desde el listado.
2. Se abre `expo-camera` para tomar la foto de evidencia (obligatorio,
   sin opción de galería).
3. Se solicita permiso y ubicación actual vía `expo-location`
   (`getCurrentPositionAsync`), automáticamente al abrir el formulario o
   con un botón dedicado.
4. Con lat/long obtenidas, se consulta Open-Meteo en paralelo (no bloquea
   el resto del formulario) para obtener clima actual. Si falla o no hay
   red, se continúa sin clima.
5. Usuario completa nombre del ave, cantidad de ejemplares, fecha/hora
   (prellenada, editable) y notas opcionales.
6. Al presionar guardar, se valida: si falta foto o ubicación, se muestra
   un mensaje claro indicando qué falta y no se guarda.
7. Se arma el `BirdSighting` y se guarda vía el repositorio.
8. Se confirma el guardado y se navega de vuelta al listado.

## 7. Integraciones externas

### Open-Meteo (RF-02)

- No requiere API key.
- Endpoint: `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`.
- Se mapean los `weather_code` a descripciones legibles + ícono en
  `weather.mapper.ts`, según la tabla de la documentación de Open-Meteo
  (0 = despejado, 61 = lluvia, etc.).
- Se guarda además `relative_humidity_2m` como el "tercer dato a elección".

### expo-camera (RF-01)

- Permisos de cámara solicitados en runtime, con explicación de para qué
  se piden.
- La foto se guarda en el filesystem del dispositivo; se almacena solo la
  URI en el registro (no el binario en AsyncStorage).

### expo-location (RF-01, RF-04)

- Permisos de ubicación en runtime (foreground), con explicación de para
  qué se piden.
- `getCurrentPositionAsync` al momento del registro (no tracking
  continuo).
- `reverseGeocodeAsync` para traducir lat/long a una dirección legible en
  el detalle (RF-04). Si falla, se muestra un indicador en vez de
  coordenadas crudas.

## 8. Optimización del consumo de la API

Se implementan al menos estas dos medidas (documentar en el informe con
referencia al código):

1. **Timeout + fallback silencioso**: la llamada a Open-Meteo se corta a
   los ~5s (`AbortController`) y, si falla o expira, el registro se guarda
   sin clima en vez de reintentar indefinidamente o bloquear la UI.
2. **Caché por ubicación redondeada**: se cachea en memoria (o AsyncStorage
   con TTL corto) la respuesta de Open-Meteo por coordenadas redondeadas a
   ~2 decimales durante unos minutos, evitando consultas repetidas si el
   usuario reintenta el guardado desde el mismo lugar.
3. (Opcional, si alcanza el tiempo) **Renderizado eficiente del listado**:
   `FlatList` con `keyExtractor`, imágenes en miniatura de tamaño fijo, y
   `getItemLayout` si el volumen de registros crece.

## 9. Estilos (NativeWind)

- Configuración estándar de NativeWind sobre Tailwind (`tailwind.config.js`
  apuntando a `app/**` y `src/**`).
- Componentes de UI base (Button, Card, Badge de clima, EmptyState) en
  `src/components`, estilizados con clases utilitarias.
- Diseño pensado para uso en terreno: botones grandes operables con una
  mano, alto contraste para uso bajo sol directo, jerarquía visual clara.

## 10. Consideraciones no funcionales

- **Permisos**: manejar estados de permiso denegado (cámara/ubicación) con
  mensajes claros y posibilidad de reintentar; la app no debe romperse ni
  quedar en pantalla en blanco si el usuario rechaza un permiso.
- **Errores de red**: si Open-Meteo falla, se guarda el registro sin clima
  (campo opcional) en vez de bloquear el flujo.
- **Estados de carga/vacío**: toda operación asíncrona (cámara, GPS, clima)
  muestra feedback visual; el listado sin registros muestra un estado
  vacío diseñado, no una pantalla en blanco.

## 11. Fuera de alcance técnico (ver también BRIEF.md)

- Backend/API propio y autenticación real.
- Multi-usuario, perfiles, feed comunitario, sincronización entre
  dispositivos.
- Identificación automática de especies por imagen.
