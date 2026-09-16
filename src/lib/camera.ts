import { Directory, File, Paths } from 'expo-file-system';

const PHOTOS_DIR_NAME = 'avistaves-photos';

/**
 * expo-camera guarda la foto en un archivo temporal (cache); lo copiamos al
 * directorio de documentos para que sobreviva al cierre de la app (RF-05).
 */
export function persistCapturedPhoto(temporaryUri: string): string {
  const photosDir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!photosDir.exists) {
    photosDir.create();
  }

  const source = new File(temporaryUri);
  const destination = new File(photosDir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
  source.copy(destination);

  return destination.uri;
}
