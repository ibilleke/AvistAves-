import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function ListadoScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
      <Text className="text-2xl font-bold text-emerald-800">AvistAves</Text>
      <Text className="text-center text-base text-neutral-500">
        Todavía no hay avistamientos registrados.
      </Text>

      <Pressable
        onPress={() => router.push('/new-record')}
        className="mt-4 w-full rounded-xl bg-emerald-700 px-6 py-4"
      >
        <Text className="text-center text-lg font-semibold text-white">
          Nuevo avistamiento
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push('/record/mock-id')} className="mt-2">
        <Text className="text-base text-emerald-700 underline">Ver detalle de ejemplo</Text>
      </Pressable>
    </View>
  );
}
