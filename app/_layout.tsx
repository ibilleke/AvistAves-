import '../global.css';

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Avistamientos' }} />
      <Stack.Screen name="new-record" options={{ title: 'Nuevo avistamiento' }} />
      <Stack.Screen name="record/[id]" options={{ title: 'Detalle' }} />
    </Stack>
  );
}
