import { Image, Pressable, Text, View } from 'react-native';

import type { BirdSighting } from '../features/sightings/types';

type SightingCardProps = {
  sighting: BirdSighting;
  onPress: () => void;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function SightingCard({ sighting, onPress }: SightingCardProps) {
  const hasRealPhoto = !sighting.photoUri.startsWith('mock://');

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
    >
      {hasRealPhoto ? (
        <Image
          source={{ uri: sighting.photoUri }}
          className="h-16 w-16 rounded-lg bg-neutral-100"
        />
      ) : (
        <View className="h-16 w-16 items-center justify-center rounded-lg bg-neutral-100">
          <Text className="text-2xl">🐦</Text>
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text className="text-base font-semibold text-neutral-800">{sighting.birdName}</Text>
        <Text className="text-sm text-neutral-500">{formatDate(sighting.observedAt)}</Text>
      </View>

      <Text className="text-sm font-medium text-neutral-600">
        {sighting.weather ? `${Math.round(sighting.weather.temperatureC)}°C` : 'sin clima'}
      </Text>
    </Pressable>
  );
}
