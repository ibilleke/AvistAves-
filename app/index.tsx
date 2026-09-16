import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { EmptyState } from '../src/components/EmptyState';
import { SightingCard } from '../src/components/SightingCard';
import { colors } from '../src/constants/theme';
import { sightingsRepository } from '../src/features/sightings/sightings.repository';
import type { BirdSighting } from '../src/features/sightings/types';

type SortMode = 'date' | 'name';

function sortSightings(sightings: BirdSighting[], mode: SortMode): BirdSighting[] {
  if (mode === 'name') {
    return [...sightings].sort((a, b) => a.birdName.localeCompare(b.birdName));
  }
  return sightings; // ya viene ordenado por createdAt desc desde el repositorio
}

export default function ListadoScreen() {
  const router = useRouter();
  const [sightings, setSightings] = useState<BirdSighting[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);
      sightingsRepository.getAll().then((all) => {
        if (isActive) {
          setSightings(all);
          setLoading(false);
        }
      });
      return () => {
        isActive = false;
      };
    }, []),
  );

  const goToNewRecord = () => router.push('/new-record');

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-neutral-500">Cargando avistamientos…</Text>
      </View>
    );
  }

  if (sightings.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <EmptyState onCreate={goToNewRecord} />
      </View>
    );
  }

  const visible = sortSightings(sightings, sortMode);

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-neutral-500">
          {sightings.length} avistamiento{sightings.length === 1 ? '' : 's'}
        </Text>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setSortMode('date')}
            className={`rounded-full px-3 py-1 ${
              sortMode === 'date' ? 'bg-primary' : 'bg-neutral-100'
            }`}
          >
            <Text
              className={sortMode === 'date' ? 'text-white' : 'text-neutral-600'}
            >
              Fecha
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortMode('name')}
            className={`rounded-full px-3 py-1 ${
              sortMode === 'name' ? 'bg-primary' : 'bg-neutral-100'
            }`}
          >
            <Text
              className={sortMode === 'name' ? 'text-white' : 'text-neutral-600'}
            >
              Nombre
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 pb-24"
        renderItem={({ item }) => (
          <SightingCard sighting={item} onPress={() => router.push(`/record/${item.id}`)} />
        )}
      />

      <Pressable
        onPress={goToNewRecord}
        className="absolute bottom-6 right-4 rounded-full bg-primary px-6 py-4 shadow-lg"
      >
        <Text className="text-base font-semibold text-white">+ Nuevo avistamiento</Text>
      </Pressable>
    </View>
  );
}
