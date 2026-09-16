// Paleta de la app. Los mismos valores están registrados como tokens de
// Tailwind en `tailwind.config.js` (bg-primary, text-primary, text-primary-dark,
// text-danger) para usar en className; este archivo existe para los pocos
// lugares donde React Native exige un color literal en vez de una clase
// (por ejemplo, la prop `color` de `ActivityIndicator`).
export const colors = {
  primary: '#047857', // emerald-700
  primaryDark: '#065f46', // emerald-800
  danger: '#dc2626', // red-600
  white: '#ffffff',
} as const;
