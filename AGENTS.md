# AGENTS.md

Guía para agentes (Claude, Copilot, etc.) que trabajen en este repositorio.

## Qué es este proyecto

**AvistAves** — app móvil de bitácora individual de avistamientos de aves
para uso en terreno (examen). Se registra un avistamiento (ave observada,
ubicación, clima y una foto como evidencia) y se consulta después desde un
listado y una vista de detalle. Es de un solo usuario/dispositivo: no hay
cuentas, perfiles ni feed comunitario (no se pide en el enunciado).

Documentación de referencia (leer antes de implementar features nuevas):

- [docs/BRIEF.md](docs/BRIEF.md) — idea de producto, alcance, funcionalidades.
- [docs/STACK.md](docs/STACK.md) — arquitectura técnica, modelo de datos, estructura de carpetas.
- [docs/TASKS.md](docs/TASKS.md) — plan de construcción por fases, en orden.

**Importante:** el desarrollo sigue el orden de fases de `docs/TASKS.md`.
No adelantar integraciones (cámara, ubicación, clima) antes de que el
flujo con datos mock de la fase correspondiente funcione. Si se retoma
trabajo, revisar qué checkboxes de `TASKS.md` ya están marcadas y
continuar desde ahí (y marcar las que se completen).

## Stack técnico

| Capa                | Tecnología                    |
|---------------------|--------------------------------|
| Framework           | React Native + Expo (SDK 54)   |
| Lenguaje            | TypeScript                     |
| Navegación          | Expo Router (file-based)       |
| Estilos             | NativeWind (Tailwind para RN)  |
| Cámara              | expo-camera                    |
| Ubicación           | expo-location                  |
| Persistencia local  | AsyncStorage                   |
| Clima               | Open-Meteo API (REST, sin key) |
| Gestor de paquetes  | pnpm                           |
| Entorno de pruebas  | Expo Go (SDK 54)               |

No introducir librerías fuera de este stack sin que quede reflejado en
`docs/STACK.md` (si se agrega algo nuevo, actualizar ese documento).

## Comandos

Usar **pnpm**, nunca npm/yarn:

```bash
pnpm install          # instalar dependencias
pnpm start            # iniciar Metro / Expo Go (escanear QR)
pnpm android          # abrir en emulador/dispositivo Android
pnpm ios              # abrir en simulador iOS
pnpm lint             # linter (si está configurado)
pnpm typecheck        # tsc --noEmit (si está configurado)
```

(Ajustar esta lista si los scripts definidos en `package.json` difieren.)

## Estructura de carpetas esperada

```
app/                        # Rutas de Expo Router (exactamente 3 pantallas)
  _layout.tsx
  index.tsx                  # Listado — pantalla principal (RF-03)
  new-record.tsx              # Formulario de nuevo avistamiento (RF-01)
  record/[id].tsx              # Detalle de un avistamiento (RF-04)

src/
  components/                # UI reutilizable
  features/
    sightings/                # types, repository, hooks
    weather/                   # cliente Open-Meteo + mapeo de códigos
    location/                  # reverse geocoding
  lib/                        # wrappers: storage, camera
  constants/
```

Ver detalle completo del modelo de datos (`BirdSighting`) en
`docs/STACK.md`.

## Convenciones y decisiones clave

- **Acceso a datos vía repositorio**: nunca llamar a AsyncStorage
  directamente desde componentes/pantallas; siempre a través de
  `sightings.repository.ts`. Es uno de los patrones de diseño a
  documentar en el informe (Repository).
- **Placeholders antes que integraciones reales**: al construir una
  pantalla nueva, primero hacerla funcionar con datos mock (ubicación y
  clima hardcodeados) antes de conectar `expo-camera`, `expo-location` u
  Open-Meteo, siguiendo el orden de `docs/TASKS.md`.
- **Fallos de red no bloquean el flujo**: si Open-Meteo falla, el
  registro debe poder guardarse igual, sin clima.
- **Reverse geocoding es obligatorio en el Detalle** (RF-04): mostrar solo
  lat/long no cumple el requisito. Usar `reverseGeocodeAsync` de
  expo-location.
- **No guardar binarios de fotos en AsyncStorage**: solo se persiste la
  URI del archivo (filesystem del dispositivo).

## Qué evitar

- No agregar usuarios, perfiles, login, feed comunitario ni backend: no
  se pide en el enunciado (ver "Fuera de alcance" en `docs/BRIEF.md` y
  `docs/STACK.md`). Mantener exactamente 3 pantallas: registro, listado,
  detalle.
- No agregar identificación automática de especies por IA (fuera de
  alcance).
- No usar npm/yarn ni mezclar lockfiles con pnpm.
- No saltarse fases de `docs/TASKS.md`: cada fase debe quedar testeable
  en Expo Go antes de avanzar a la siguiente. La Fase 11 (informe) y la
  Fase 0 (repo GitHub público) no son opcionales: son entregables
  evaluados aparte del código.
