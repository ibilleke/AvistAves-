# Brief — AvistAves (Bitácora de avistamiento de aves)

Este brief sigue el enunciado oficial del examen (`docs/enunciado-examen-avistaves.pdf`).
Ante cualquier duda, el enunciado manda sobre este documento.

## 1. Resumen del proyecto

Aplicación móvil para que voluntarios de una red de observadores de aves
registren avistamientos en terreno: qué vieron, dónde, con qué evidencia
fotográfica y bajo qué clima. Es una bitácora personal en el dispositivo,
**no** una app social ni multiusuario.

## 2. Problema

En terreno no siempre se sabe qué ave se vio, y sin un registro estructurado
se pierde información valiosa (ubicación exacta, clima, evidencia
fotográfica).

## 3. Objetivo

Permitir crear un registro completo (foto + ubicación + clima) en el
momento del avistamiento, con mínima fricción, y consultarlo después desde
un listado y una vista de detalle.

## 4. Framework elegido

**React Native + Expo.**

| Necesidad        | Librería          |
|-------------------|--------------------|
| Cámara            | expo-camera         |
| GPS               | expo-location        |
| Guardar datos     | AsyncStorage          |
| Correr en teléfono | Expo Go              |

## 5. Pantallas (exactamente 3, según RF-06)

1. **Registro** (`new-record`) — formulario de nuevo avistamiento (RF-01).
2. **Listado** (`index` / home) — todos los avistamientos, más reciente
   primero (RF-03). Es la pantalla principal de la app.
3. **Detalle** (`record/[id]`) — vista completa de un avistamiento (RF-04).

No hay pantalla de perfil, login ni feed comunitario: **no se pide** en el
enunciado. Mantener el alcance a estas tres pantallas es parte de lo que se
evalúa (Componentes de UI, RF-01/RF-03/RF-06).

## 6. Datos de un avistamiento (RF-01)

| Campo                  | Origen                  | Obligatorio |
|-------------------------|--------------------------|-------------|
| Fotografía               | Cámara del dispositivo (no galería) | Sí |
| Latitud y longitud        | GPS del dispositivo       | Sí |
| Clima del momento         | Open-Meteo (RF-02)        | No |
| Nombre del ave            | Texto libre (acepta "no identificada") | Sí |
| Fecha y hora              | Automática al abrir el formulario, editable por el usuario | Sí |
| Cantidad de ejemplares     | Numérico, mínimo 1        | Sí |
| Notas                     | Texto libre               | No |

Reglas de comportamiento:

- La foto se toma con la cámara en el momento; no se permite elegir de la
  galería.
- La ubicación se captura automáticamente (al abrir el formulario o con un
  botón dedicado); el usuario nunca escribe coordenadas a mano.
- Debe validar antes de guardar: sin foto o sin ubicación no se guarda, y el
  mensaje de error debe indicar cuál campo falta.
- Al guardar con éxito, la app confirma y vuelve al listado.

## 7. Clima del avistamiento (RF-02)

Al capturar la ubicación, se consulta Open-Meteo con esas coordenadas y se
guarda el clima junto al registro (dato histórico del momento, no se
vuelve a consultar después).

```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code
```

Se guarda y muestra como mínimo:

1. Temperatura (`temperature_2m`).
2. Condición climática, traducida desde `weather_code` a texto + ícono
   (tabla de códigos en la documentación de Open-Meteo).
3. Un tercer dato a elección: **humedad relativa** (`relative_humidity_2m`)
   o viento (`wind_speed_10m`) — se elige humedad relativa.

Si la API falla o no hay red, el avistamiento se guarda igual, sin clima.
Nunca se bloquea el registro por un problema de conexión.

## 8. Listado de avistamientos (RF-03)

Pantalla principal, ordenada del más reciente al más antiguo. Cada ítem
muestra: miniatura de la foto, nombre del ave, fecha, y temperatura (o un
indicador de "sin clima" si no se obtuvo).

Además:

- Un filtro o un ordenamiento a elección (fecha, nombre del ave o
  cantidad). Se elige **ordenar por fecha o por nombre del ave**
  (a definir en implementación).
- Estado vacío diseñado (ilustración/mensaje + botón de acceso al
  formulario), no una pantalla en blanco.
- Acceso directo al formulario de registro.

## 9. Detalle de un avistamiento (RF-04)

- Foto en tamaño grande.
- Todos los datos del formulario.
- Clima legible (texto + ícono, nunca el `weather_code` crudo).
- Ubicación en formato legible para una persona: **reverse geocoding
  obligatorio** vía `reverseGeocodeAsync` de expo-location (mostrar solo
  lat/long no cumple el requisito). Si el reverse geocoding falla, se
  muestra un indicador claro en vez de coordenadas crudas.

## 10. Persistencia (RF-05)

AsyncStorage. Los avistamientos (incluidas las fotos, referenciadas por
URI del filesystem) deben sobrevivir al cierre de la app.

## 11. Navegación (RF-06)

Navegación coherente entre las 3 pantallas con Expo Router. El usuario
siempre puede volver atrás sin quedar atrapado.

## 12. También evaluado (fuera de los RF pero parte de la rúbrica)

- Estados de carga/error/vacío en toda operación asíncrona (cámara, GPS,
  clima) — nunca una pantalla congelada.
- Permisos: pedirlos, explicar para qué, y no romper el flujo si se
  rechazan.
- Optimización del consumo de la API: implementar **al menos 2** medidas
  (ver `docs/STACK.md` sección de optimización) y documentarlas en el
  informe.
- Diseño para uso en terreno: una mano, sol en la pantalla, buen contraste
  y jerarquía visual.

## 13. Fuera de alcance

- Identificación automática de especies por IA.
- Cuentas de usuario, login, perfiles, feed comunitario o cualquier noción
  de multi-usuario — no se pide en el enunciado.
- Notificaciones push.
- Sincronización entre dispositivos / backend propio.

## 14. Entregables (fuera del código)

1. Repositorio en GitHub público, con `README.md`.
2. Informe con demostración (video ≤3 min, o PDF/Markdown con capturas o
   link a demo) que cubra:
   - Arquitectura de Expo/React Native (cómo funciona por dentro, rol de
     Expo, terminología correcta).
   - Tres patrones de diseño presentes en el framework, señalados en el
     código propio (con referencias a archivo/línea).
   - Comparación con otros dos frameworks, uno de ellos debe ser el que no
     se eligió (Ionic + Capacitor), con fortalezas y debilidades reales,
     no solo un listado de ventajas.
   - Declaración de qué uso se le dio a IA y para qué.
   - Demostración de la app corriendo en teléfono/emulador: registrar un
     avistamiento real, con cámara y GPS en vivo.

Ver `docs/STACK.md` para arquitectura técnica y `docs/TASKS.md` para el
plan de construcción por fases.
