# 🐦 AvistAves

**Bitácora móvil para voluntarios de una red de observadores de aves.**

AvistAves permite registrar un avistamiento en terreno —con foto, ubicación
GPS y clima del momento— y consultarlo después desde un listado y una vista
de detalle. Es una app de un solo usuario/dispositivo: sin cuentas, perfiles
ni feed comunitario, pensada para uso rápido a una mano en terreno.

## Tabla de contenidos

- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Scripts disponibles](#scripts-disponibles)
- [Pantallas](#pantallas)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Modelo de datos](#modelo-de-datos)
- [Optimización de la API de clima](#optimización-de-la-api-de-clima)
- [Pruebas](#pruebas)
- [Documentación adicional](#documentación-adicional)

## Características

- 📸 **Registro fotográfico en el momento** — la evidencia se toma con la
  cámara del dispositivo (sin opción de galería).
- 📍 **Geolocalización automática** — captura de GPS y reverse geocoding a
  una dirección legible.
- ☀️ **Clima en tiempo real** — temperatura, condición y humedad relativa
  vía [Open-Meteo](https://open-meteo.com/), sin necesidad de API key.
- 💾 **Persistencia local** — los avistamientos sobreviven al cierre de la
  app (AsyncStorage), sin backend ni cuentas.
- 🛡️ **Resiliente a fallos** — sin red o sin permisos, el registro se sigue
  guardando; la app nunca queda bloqueada ni en blanco.
- ✅ **Cubierto con pruebas unitarias** — lógica de negocio testeada con
  Jest y React Native Testing Library.

## Stack técnico

| Capa                | Tecnología                        |
|----------------------|-------------------------------------|
| Framework            | React Native + Expo (SDK 54)       |
| Lenguaje             | TypeScript                          |
| Navegación           | Expo Router (file-based routing)   |
| Estilos              | NativeWind (Tailwind para RN)      |
| Cámara               | expo-camera                         |
| Ubicación            | expo-location                       |
| Persistencia local   | AsyncStorage                        |
| Clima                | Open-Meteo API (REST, sin API key) |
| Pruebas              | Jest + React Native Testing Library|
| Gestor de paquetes   | pnpm                                 |

Detalle completo de la arquitectura en [`docs/STACK.md`](docs/STACK.md).

## Requisitos previos

- [Node.js](https://nodejs.org/) (LTS recomendado)
- [pnpm](https://pnpm.io/)
- La app **Expo Go** instalada en un dispositivo físico (Android/iOS), o un
  emulador Android / simulador iOS

## Instalación y ejecución

```bash
pnpm install
pnpm start
```

Esto levanta Metro y muestra un código QR: escaneálo con Expo Go (Android)
o la cámara (iOS) para abrir la app en el dispositivo.

## Scripts disponibles

| Comando           | Descripción                                    |
|--------------------|--------------------------------------------------|
| `pnpm start`       | Inicia el servidor de desarrollo (Expo/Metro)   |
| `pnpm android`     | Abre la app en emulador/dispositivo Android      |
| `pnpm ios`         | Abre la app en simulador iOS (requiere macOS)    |
| `pnpm lint`        | Corre ESLint                                     |
| `pnpm typecheck`   | Verifica tipos con `tsc --noEmit`                |
| `pnpm test`        | Corre las pruebas unitarias (Jest)               |

## Pantallas

La app tiene exactamente 3 pantallas, conectadas con Expo Router:

1. **Listado** (`/`) — todos los avistamientos, ordenados del más reciente
   al más antiguo. Muestra miniatura, nombre del ave, fecha y temperatura
   (o un indicador de "sin clima"). Incluye estado vacío diseñado y acceso
   directo al formulario de registro.
2. **Registro** (`/new-record`) — formulario de nuevo avistamiento: foto
   (cámara), ubicación y clima se capturan automáticamente; el usuario
   completa nombre del ave, cantidad de ejemplares, fecha/hora (prellenada,
   editable) y notas opcionales. Valida que haya foto y ubicación antes de
   guardar.
3. **Detalle** (`/record/[id]`) — vista completa de un avistamiento: foto en
   tamaño grande, todos los datos del formulario, clima legible (texto +
   ícono) y ubicación traducida a dirección mediante reverse geocoding.

## Arquitectura del proyecto

```
app/
  _layout.tsx                # Layout raíz (Stack de Expo Router)
  index.tsx                  # Listado — pantalla principal
  new-record.tsx             # Formulario de nuevo avistamiento
  record/
    [id].tsx                 # Detalle de un avistamiento

src/
  components/                # Componentes UI reutilizables
  constants/                  # Tema y constantes de UI (colores)
  features/
    sightings/                # Modelo, repositorio y hooks de avistamientos
    weather/                   # Cliente Open-Meteo y mapeo de clima
    location/                  # Ubicación (hook de GPS) y reverse geocoding
  lib/                        # Wrappers de AsyncStorage, cámara, etc.
```

Los colores de la app están centralizados en
[`src/constants/theme.ts`](src/constants/theme.ts) (para props nativas como
`color` en `ActivityIndicator`) y replicados como tokens de Tailwind en
[`tailwind.config.js`](tailwind.config.js) (`bg-primary`, `text-primary`,
`text-primary-dark`, `text-danger`), para no repetir códigos de color hex
sueltos en cada pantalla.

El acceso a datos está aislado detrás de un **patrón Repository**
(`sightings.repository.ts`), que expone `getAll`, `create` y `getById` sin
exponer AsyncStorage al resto de la app.

## Modelo de datos

```ts
type BirdSighting = {
  id: string;
  birdName: string;            // acepta "no identificada"
  count: number;                // mínimo 1
  notes?: string;
  photoUri: string;             // uri local de la foto
  observedAt: string;           // fecha/hora del avistamiento (editable)
  location: {
    latitude: number;
    longitude: number;
    placeName?: string;         // resultado de reverse geocoding
  };
  weather?: {                   // ausente si Open-Meteo falló o no había red
    temperatureC: number;
    relativeHumidity: number;
    weatherCode: number;
    description: string;
    icon: string;
  };
  createdAt: string;            // momento real de guardado (orden del listado)
};
```

## Optimización del consumo de la API

Para evitar llamadas innecesarias a Open-Meteo y mantener la UI responsiva:

1. **Timeout + fallback silencioso** — la llamada se corta a los ~5s
   (`AbortController`); si expira, el registro se guarda sin clima en vez
   de bloquear la UI.
2. **Reintento con backoff ante fallos de red transitorios** — un fallo de
   red (no un timeout) dispara un único reintento tras una espera corta;
   si vuelve a fallar, se guarda el avistamiento sin clima.
3. **Caché por ubicación redondeada** — se cachea la respuesta por
   coordenadas redondeadas a ~2 decimales durante unos minutos, evitando
   consultas repetidas si el usuario reintenta el guardado desde el mismo
   lugar.
4. **Renderizado eficiente del listado** — `FlatList` con `keyExtractor`
   por `id` y miniaturas de tamaño fijo en `SightingCard`, evitando
   trabajo innecesario de render durante el scroll.

Detalle con referencias a archivo/línea en
[`docs/OPTIMIZACION.md`](docs/OPTIMIZACION.md).

## Pruebas

Suite de pruebas unitarias con Jest (`jest-expo`) y React Native Testing
Library, cubriendo la lógica que no depende de hardware real:

- Parseo/formato de fecha del formulario (`dateInput`)
- Wrapper de AsyncStorage (`storage`)
- Repositorio de avistamientos: `getAll`, `create`, `getById`, orden por
  fecha, ids únicos
- Mapeo de `weather_code` y cliente de Open-Meteo (éxito, fallo de red,
  respuesta no-ok, caché por ubicación, reintento tras fallo transitorio,
  sin reintento ante timeout/abort)
- Reverse geocoding: formato de dirección y manejo de fallos
- Render y eventos de UI de `EmptyState` y `SightingCard`

```bash
pnpm test
```

Cámara y GPS reales no se testean por unidad (requieren hardware); se
verifican manualmente en Expo Go.

## Documentación adicional

- [`docs/BRIEF.md`](docs/BRIEF.md) — detalle funcional y requerimientos
- [`docs/STACK.md`](docs/STACK.md) — arquitectura técnica completa
- [`docs/TASKS.md`](docs/TASKS.md) — plan de construcción por fases
- [`docs/OPTIMIZACION.md`](docs/OPTIMIZACION.md) — medidas de optimización
  del consumo de la API, con referencias a archivo/línea
