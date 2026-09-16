# Informe — AvistAves

> Borrador técnico (Fase 11 de `docs/TASKS.md`). Completar antes de
> entregar: el link/video de la demo (sección 5) y revisar la
> declaración de uso de IA (sección 4) para que refleje exactamente lo
> que se usó.

## 1. Arquitectura: cómo funciona Expo/React Native por dentro

React Native no renderiza una vista web ni interpreta HTML: el código
JavaScript/TypeScript de la app corre en un motor JS separado (Hermes,
el motor por defecto en Expo SDK 54) y se comunica con el lado nativo
(Kotlin/Java en Android, Swift/Objective-C en iOS) para pedirle que
dibuje **componentes de UI nativos reales** (un `<Text>` se traduce en un
`TextView` nativo en Android, no en un `<span>` de HTML). Esa
comunicación entre el hilo de JavaScript y el hilo nativo se hace a
través de **JSI (JavaScript Interface)**: en las versiones modernas de
React Native (incluida la 0.81 usada en este proyecto) JSI reemplazó al
antiguo "bridge" asíncrono basado en paso de mensajes serializados en
JSON, permitiendo invocar funciones nativas de forma más directa y
síncrona cuando hace falta (por ejemplo, para leer una propiedad de un
`HostObject` nativo sin round-trip). Esto es lo que se conoce como la
**Nueva Arquitectura** de React Native.

**Expo** no es un framework alternativo a React Native, sino una capa de
herramientas y librerías construida sobre él:

- **Expo SDK**: un conjunto curado de módulos nativos ya integrados y
  versionados juntos (`expo-camera`, `expo-location`,
  `expo-file-system`, etc.), evitando tener que configurar manualmente
  cada dependencia nativa por versión de Android/iOS.
- **Expo Go**: una app cliente pre-compilada (disponible en las tiendas)
  que ya trae embebidos los módulos nativos del SDK soportado (en este
  caso, SDK 54). Permite correr el proyecto en un dispositivo físico sin
  compilar un binario nativo propio: Metro (el bundler de React Native)
  sirve el JavaScript por HTTP/WebSocket y Expo Go lo descarga y ejecuta
  dentro de su propio runtime nativo. Esto es lo que se usó para
  desarrollar y probar esta app (`pnpm start` + escanear el QR).
- **Managed workflow**: el modelo de desarrollo donde no existen
  carpetas `android/` ni `ios/` en el repositorio; la configuración
  nativa (permisos, iconos, splash screen) se declara de forma
  declarativa en `app.json` y los **config plugins** (ver
  `app.json:25-38`, plugins `expo-router`, `expo-camera`,
  `expo-location`) la aplican automáticamente al momento de generar un
  build real con EAS Build. Mientras se prueba en Expo Go, esos plugins
  no modifican nada (Expo Go ya trae los permisos necesarios
  declarados); solo importan al generar un binario standalone.
- **Expo Router**: enrutamiento por archivos (`app/`) construido sobre
  React Navigation, que traduce la estructura de carpetas en pantallas y
  rutas (`app/index.tsx` → `/`, `app/new-record.tsx` → `/new-record`,
  `app/record/[id].tsx` → `/record/:id`).

## 2. Tres patrones de diseño presentes en el código

### 2.1 Repository

**Dónde:** `src/features/sightings/sightings.repository.ts:14-37`.

Todo acceso a los datos persistidos pasa por el objeto
`sightingsRepository` (`getAll`, `getById`, `create`), que internamente
usa `readAll()` (línea 10-12) y el wrapper de AsyncStorage
(`src/lib/storage.ts`). Ninguna pantalla llama a AsyncStorage
directamente (ver `app/index.tsx`, `app/new-record.tsx`,
`app/record/[id].tsx`, que solo importan `sightingsRepository`). Esto
aísla el resto de la app del mecanismo de persistencia concreto: si
mañana se cambiara AsyncStorage por SQLite, solo habría que reescribir
este archivo.

### 2.2 Custom Hook (encapsulamiento de estado + efectos)

**Dónde:** `src/features/location/useCurrentLocation.ts:11-42`.

React no tiene un patrón "Hook" fuera de su propio ecosistema, pero
dentro de él cumple el mismo rol que un patrón de diseño clásico:
encapsula un pedazo de estado con ciclo de vida propio (pedir permiso,
consultar GPS, manejar error) detrás de una interfaz simple
(`{ status, coords, canAskAgain, retry }`) que cualquier componente
puede consumir sin conocer los detalles de `expo-location`. El
componente `app/new-record.tsx` solo hace
`const location = useCurrentLocation()` y reacciona a `location.status`
en el JSX, sin manejar permisos ni promesas de GPS directamente. El
mismo patrón se repite para el clima con el `useEffect` que llama a
`fetchCurrentWeather` en `app/new-record.tsx`.

### 2.3 Adapter

**Dónde:** `src/features/weather/openMeteo.client.ts` +
`src/features/weather/weather.mapper.ts`.

Open-Meteo devuelve un formato propio (`current.temperature_2m`,
`current.weather_code` como número WMO crudo). `weather.mapper.ts`
(`mapWeatherCode`, línea 39-41 del archivo) adapta ese código numérico a
un objeto `{ description, icon }` legible para humanos, y
`openMeteo.client.ts` (línea 56-62) ensambla la respuesta cruda de la
API externa en la forma interna que usa el resto de la app
(`BirdSighting['weather']`, definido en `src/features/sightings/types.ts`).
Si mañana se cambiara de proveedor de clima, solo este archivo debería
cambiar; el resto de la app (formulario, listado, detalle) no conoce el
formato de Open-Meteo, solo el tipo `BirdSighting['weather']`.

## 3. Comparación con otros frameworks

### React Native + Expo (el elegido)

- **Fortalezas:** UI nativa real (no WebView), acceso a módulos nativos
  maduros y ya empaquetados vía Expo SDK, ciclo de prueba muy rápido con
  Expo Go (sin compilar nativo durante el desarrollo), gran ecosistema y
  comunidad.
- **Debilidades:** para funcionalidades nativas muy específicas que no
  tienen módulo de Expo, hay que salir del managed workflow (config
  plugins personalizados o "eject" parcial) o escribir un módulo nativo
  propio; el tamaño del bundle/APK tiende a ser mayor que una app 100%
  nativa; dos motores (JS + nativo) implican una capa de comunicación
  (JSI) que, aunque rápida, sigue siendo overhead comparado con código
  nativo puro.

### Ionic + Capacitor

- **Fortalezas:** reutiliza directamente conocimiento web (HTML/CSS/JS o
  cualquier framework web como Angular/React/Vue) sin aprender un
  sistema de componentes nuevo; Capacitor expone plugins nativos
  similares en espíritu a los de Expo (cámara, geolocalización) con una
  API basada en promesas; es la opción más natural si el equipo ya tiene
  una web app y quiere empaquetarla como app móvil con mínimo cambio de
  paradigma.
- **Debilidades:** la UI corre dentro de un **WebView** (no componentes
  nativos), lo que en general implica más consumo de memoria y una
  sensación de scroll/animaciones menos "nativa" que React Native o
  Flutter, especialmente en listas largas o gestos complejos; el acceso
  a APIs nativas de bajo nivel (por ejemplo, control fino de cámara)
  suele requerir escribir un plugin nativo propio en Swift/Kotlin,
  perdiendo parte de la promesa de "un solo código para todo".

### Flutter

- **Fortalezas:** un solo motor de renderizado (Skia/Impeller) dibuja
  toda la UI píxel por píxel de forma consistente en Android e iOS, sin
  depender de los widgets nativos de cada plataforma, lo que da un
  control visual y una consistencia entre plataformas muy altos;
  rendimiento generalmente superior a WebView-based (Ionic) y comparable
  o mejor que React Native en animaciones complejas, porque no depende
  de un puente hacia componentes nativos para cada elemento visual.
- **Debilidades:** Dart es un lenguaje y ecosistema aparte (curva de
  aprendizaje si el equipo ya sabe JS/TS, como en este proyecto); al no
  usar widgets nativos, una app Flutter puede "sentirse" ligeramente
  distinta a las convenciones visuales nativas de cada plataforma si no
  se cuida el detalle; el ecosistema de paquetes, aunque grande, es más
  chico que el de npm/React Native para casos muy específicos.

## 4. Declaración de uso de IA

Se usó **Claude Code** (Anthropic) como asistente de desarrollo durante
todo el proyecto, siguiendo el plan de fases de `docs/TASKS.md`
(`docs/BRIEF.md` y `docs/STACK.md` como especificación de referencia).
Concretamente se usó para:

- Generar el scaffold inicial del proyecto (Expo SDK 54 + TypeScript +
  Expo Router + NativeWind + ESLint) y resolver un problema real de
  compatibilidad entre pnpm (modo *isolated* por defecto) y Metro que
  impedía que arrancara el bundler, cambiando `pnpm-workspace.yaml` a
  `nodeLinker: hoisted` (documentado como solución oficial por Expo).
- Escribir el código de cada fase (modelo de datos, repositorio,
  formulario, listado, detalle, integraciones de cámara/ubicación/clima,
  optimización de API) consultando la documentación oficial vigente de
  cada paquete (`expo-camera`, `expo-location`, `expo-file-system`,
  NativeWind) para usar las APIs actuales de SDK 54, no patrones
  deprecados.
- Redactar este informe (arquitectura, patrones de diseño con referencia
  a archivo/línea, comparación de frameworks).

_(Completar: quién revisó/probó el código en dispositivo real, y si se
usó IA para alguna otra tarea no mencionada aquí — por ejemplo, para
diseño visual o para escribir texto de otra sección.)_

## 5. Demo

_Pendiente: video (≤3 min) o capturas/link mostrando el flujo completo
en Expo Go: crear un avistamiento con foto y GPS reales, ver el listado,
abrir el detalle con clima y dirección legible._

## 6. Publicación

Este documento debe enlazarse desde `README.md` una vez completadas las
secciones 4 y 5.
