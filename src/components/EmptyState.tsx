import { Pressable, Text, View } from 'react-native';

type EmptyStateProps = {
  onCreate: () => void;
};

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text className="text-5xl">🐦</Text>
      <Text className="text-center text-lg font-semibold text-neutral-700">
        Todavía no registraste ningún avistamiento
      </Text>
      <Text className="text-center text-neutral-500">
        Tocá el botón para crear el primero.
      </Text>
      <Pressable
        onPress={onCreate}
        className="mt-4 w-full rounded-xl bg-emerald-700 px-6 py-4"
      >
        <Text className="text-center text-lg font-semibold text-white">
          Nuevo avistamiento
        </Text>
      </Pressable>
    </View>
  );
}
