# AvistAves

Bitácora móvil para voluntarios de una red de observadores de aves. Permite
registrar un avistamiento en terreno (foto, ubicación GPS y clima del
momento) y consultarlo después desde un listado y una vista de detalle. Es
una app de un solo usuario/dispositivo: no tiene cuentas, perfiles ni feed
comunitario.

Ver [`docs/BRIEF.md`](docs/BRIEF.md) para el detalle funcional y
[`docs/STACK.md`](docs/STACK.md) para la arquitectura técnica.

## Stack

- React Native + Expo (SDK 54), TypeScript
- Expo Router (navegación por archivos)
- NativeWind (Tailwind para React Native)
- expo-camera, expo-location
- AsyncStorage (persistencia local)
- Open-Meteo (clima, sin API key)
- pnpm

## Cómo correrla

Requiere Node.js y pnpm instalados, y la app **Expo Go** en un dispositivo
físico (o un emulador Android/iOS).

```bash
pnpm install
pnpm start
```

Esto levanta Metro y muestra un código QR: escanealo con Expo Go (Android)
o la cámara (iOS) para abrir la app en el dispositivo.

Otros comandos:

```bash
pnpm android     # abrir en emulador/dispositivo Android
pnpm ios         # abrir en simulador iOS (requiere macOS)
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
```

## Pantallas

1. **Listado** (`/`) — todos los avistamientos, más reciente primero.
2. **Registro** (`/new-record`) — formulario de nuevo avistamiento (foto,
   ubicación, clima automáticos).
3. **Detalle** (`/record/[id]`) — vista completa de un avistamiento.

## Estado del desarrollo

El plan de construcción por fases está en
[`docs/TASKS.md`](docs/TASKS.md).

## Informe

Ver [`docs/INFORME.md`](docs/INFORME.md) (arquitectura, patrones de
diseño, comparación de frameworks, declaración de uso de IA). Falta
agregar el video/capturas de la demo antes de la entrega final.
