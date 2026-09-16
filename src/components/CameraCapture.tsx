import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors } from '../constants/theme';

type CameraCaptureProps = {
  onCapture: (uri: string) => void;
  onCancel: () => void;
};

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-black">
        <ActivityIndicator size="large" color={colors.white} />
        <Text className="text-white">Verificando permiso de cámara…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-black px-6">
        <Text className="text-center text-lg text-white">
          Necesitamos acceso a la cámara para registrar la evidencia
          fotográfica del avistamiento.
        </Text>
        <Pressable
          onPress={requestPermission}
          className="w-full items-center rounded-xl bg-primary px-6 py-4"
        >
          <Text className="text-lg font-semibold text-white">
            {permission.canAskAgain ? 'Dar permiso' : 'Reintentar'}
          </Text>
        </Pressable>
        <Pressable onPress={onCancel} className="items-center px-6 py-2">
          <Text className="text-base text-neutral-300">Cancelar</Text>
        </Pressable>
      </View>
    );
  }

  const handleCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } finally {
      setCapturing(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

      {capturing && (
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}

      <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between p-6">
        <Pressable
          onPress={onCancel}
          disabled={capturing}
          className="rounded-full bg-black/50 px-5 py-3 disabled:opacity-50"
        >
          <Text className="text-base text-white">Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleCapture}
          disabled={capturing}
          className="h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/30 disabled:opacity-50"
        >
          <View className="h-12 w-12 rounded-full bg-white" />
        </Pressable>
        <View className="w-16" />
      </View>
    </View>
  );
}
