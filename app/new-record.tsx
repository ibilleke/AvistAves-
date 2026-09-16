import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CameraCapture } from '../src/components/CameraCapture';
import { colors } from '../src/constants/theme';
import { persistCapturedPhoto } from '../src/lib/camera';
import { formatForInput, parseInputDate } from '../src/lib/dateInput';
import { useCurrentLocation } from '../src/features/location/useCurrentLocation';
import { sightingsRepository } from '../src/features/sightings/sightings.repository';
import type { BirdSighting } from '../src/features/sightings/types';
import { fetchCurrentWeather } from '../src/features/weather/openMeteo.client';

export default function NewRecordScreen() {
  const router = useRouter();
  const [birdName, setBirdName] = useState('');
  const [count, setCount] = useState('1');
  const [observedAtText, setObservedAtText] = useState(() => formatForInput(new Date()));
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const location = useCurrentLocation();
  const [weather, setWeather] = useState<BirdSighting['weather']>(undefined);
  const [weatherStatus, setWeatherStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (!location.coords) return;
    let isActive = true;
    setWeatherStatus('loading');
    fetchCurrentWeather(location.coords.latitude, location.coords.longitude).then((result) => {
      if (!isActive) return;
      setWeather(result);
      setWeatherStatus('done');
    });
    return () => {
      isActive = false;
    };
  }, [location.coords]);

  if (showCamera) {
    return (
      <CameraCapture
        onCancel={() => setShowCamera(false)}
        onCapture={(uri) => {
          setPhotoUri(persistCapturedPhoto(uri));
          setShowCamera(false);
        }}
      />
    );
  }

  const handleSave = async () => {
    const trimmedName = birdName.trim();
    const parsedCount = Number(count);
    const observedAtDate = parseInputDate(observedAtText.trim());

    if (!photoUri) {
      Alert.alert('Falta la foto', 'Tomá una foto como evidencia del avistamiento.');
      return;
    }
    if (!location.coords) {
      Alert.alert(
        'Falta la ubicación',
        'No pudimos obtener tu ubicación. Revisá el permiso e intentá de nuevo.',
      );
      return;
    }
    if (!trimmedName) {
      Alert.alert('Falta el nombre del ave', 'Escribí un nombre (o "no identificada").');
      return;
    }
    if (!Number.isInteger(parsedCount) || parsedCount < 1) {
      Alert.alert('Cantidad inválida', 'La cantidad de ejemplares debe ser 1 o más.');
      return;
    }
    if (!observedAtDate) {
      Alert.alert('Fecha inválida', 'Usá el formato AAAA-MM-DD HH:mm.');
      return;
    }

    setSaving(true);
    try {
      await sightingsRepository.create({
        birdName: trimmedName,
        count: parsedCount,
        notes: notes.trim() || undefined,
        photoUri,
        observedAt: observedAtDate.toISOString(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        weather,
      });
      Alert.alert('Avistamiento guardado', undefined, [
        { text: 'OK', onPress: () => router.replace('/') },
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white" contentContainerClassName="gap-4 p-6">
      <Text className="text-xl font-semibold text-primary-dark">Nuevo avistamiento</Text>

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-600">Foto (evidencia)</Text>
        {photoUri ? (
          <View className="gap-2">
            <Image source={{ uri: photoUri }} className="h-48 w-full rounded-xl bg-neutral-100" />
            <Pressable
              onPress={() => setShowCamera(true)}
              className="items-center rounded-lg border border-neutral-300 px-4 py-3"
            >
              <Text className="text-base text-neutral-700">Tomar otra foto</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowCamera(true)}
            className="items-center rounded-xl border border-dashed border-neutral-400 px-4 py-6"
          >
            <Text className="text-base font-medium text-neutral-600">📷 Tomar foto</Text>
          </Pressable>
        )}
      </View>

      <View className="gap-2 rounded-xl border border-neutral-200 p-3">
        <Text className="text-sm font-medium text-neutral-600">Ubicación</Text>
        {location.status === 'loading' && (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-neutral-500">Obteniendo ubicación…</Text>
          </View>
        )}
        {location.status === 'granted' && location.coords && (
          <Text className="text-primary">
            ✓ {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        )}
        {(location.status === 'denied' || location.status === 'error') && (
          <View className="gap-2">
            <Text className="text-danger">
              {location.status === 'denied'
                ? 'Permiso de ubicación denegado.'
                : 'No se pudo obtener la ubicación.'}
            </Text>
            <Pressable
              onPress={location.retry}
              className="items-center rounded-lg border border-neutral-300 px-4 py-2"
            >
              <Text className="text-neutral-700">Reintentar</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View className="gap-2 rounded-xl border border-neutral-200 p-3">
        <Text className="text-sm font-medium text-neutral-600">Clima</Text>
        {weatherStatus === 'idle' && (
          <Text className="text-neutral-500">Esperando ubicación…</Text>
        )}
        {weatherStatus === 'loading' && (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-neutral-500">Consultando clima…</Text>
          </View>
        )}
        {weatherStatus === 'done' && weather && (
          <Text className="text-primary">
            {weather.icon} {weather.description}, {Math.round(weather.temperatureC)}°C,{' '}
            {weather.relativeHumidity}% humedad
          </Text>
        )}
        {weatherStatus === 'done' && !weather && (
          <Text className="text-neutral-500">Sin clima (no bloquea el registro)</Text>
        )}
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-600">Nombre del ave</Text>
        <TextInput
          value={birdName}
          onChangeText={setBirdName}
          placeholder='Ej: Zorzal (o "no identificada")'
          className="rounded-lg border border-neutral-300 px-4 py-3 text-base"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-600">Cantidad de ejemplares</Text>
        <TextInput
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
          className="rounded-lg border border-neutral-300 px-4 py-3 text-base"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-600">Fecha y hora (AAAA-MM-DD HH:mm)</Text>
        <TextInput
          value={observedAtText}
          onChangeText={setObservedAtText}
          className="rounded-lg border border-neutral-300 px-4 py-3 text-base"
        />
      </View>

      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-600">Notas (opcional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          className="rounded-lg border border-neutral-300 px-4 py-3 text-base"
        />
      </View>

      <Pressable
        onPress={handleSave}
        disabled={saving}
        className="mt-2 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 disabled:opacity-50"
      >
        {saving && <ActivityIndicator size="small" color={colors.white} />}
        <Text className="text-lg font-semibold text-white">
          {saving ? 'Guardando…' : 'Guardar avistamiento'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
