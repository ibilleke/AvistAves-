import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-xl font-semibold text-emerald-800">Detalle de avistamiento</Text>
      <Text className="mt-2 text-center text-neutral-500">id: {id}</Text>
    </View>
  );
}
