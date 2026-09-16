import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { sightingsRepository } from '../../src/features/sightings/sightings.repository';
import type { BirdSighting } from '../../src/features/sightings/types';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sighting, setSighting] = useState<BirdSighting | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    sightingsRepository.getById(id).then((found) => setSighting(found ?? null));
  }, [id]);

  if (sighting === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-neutral-500">Cargando…</Text>
      </View>
    );
  }

  if (sighting === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-neutral-700">
          No se encontró este avistamiento.
        </Text>
      </View>
    );
  }

  const hasRealPhoto = !sighting.photoUri.startsWith('mock://');

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="gap-4 p-6">
      {hasRealPhoto ? (
        <Image
          source={{ uri: sighting.photoUri }}
          className="h-64 w-full rounded-xl bg-neutral-100"
        />
      ) : (
        <View className="h-64 w-full items-center justify-center rounded-xl bg-neutral-100">
          <Text className="text-5xl">🐦</Text>
        </View>
      )}

      <Text className="text-2xl font-bold text-emerald-800">{sighting.birdName}</Text>

      <View className="gap-3 rounded-xl border border-neutral-200 p-4">
        <DetailRow label="Cantidad de ejemplares" value={String(sighting.count)} />
        <DetailRow label="Fecha y hora" value={formatDateTime(sighting.observedAt)} />
        <DetailRow
          label="Ubicación"
          value={sighting.location.placeName ?? 'Dirección no disponible'}
        />
        <DetailRow
          label="Clima"
          value={
            sighting.weather
              ? `${sighting.weather.icon} ${sighting.weather.description}, ${Math.round(
                  sighting.weather.temperatureC,
                )}°C, ${sighting.weather.relativeHumidity}% humedad`
              : 'Sin datos de clima'
          }
        />
        {sighting.notes ? <DetailRow label="Notas" value={sighting.notes} /> : null}
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-neutral-500">{label}</Text>
      <Text className="text-base text-neutral-800">{value}</Text>
    </View>
  );
}
