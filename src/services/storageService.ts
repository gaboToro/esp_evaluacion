import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export const comprimirYSubirEvidencia = async (file: File, idTarea: string): Promise<string> => {
  // 1. Compresión optimizada para dispositivos móviles (Evita el Memory Kill)
  const opcionesCompresion = {
    maxSizeMB: 0.15, 
    maxWidthOrHeight: 800, 
    useWebWorker: false, // Apagado obligatoriamente para móviles
    fileType: 'image/jpeg',
    initialQuality: 0.7
  };
  
  const imagenComprimida = await imageCompression(file, opcionesCompresion);
  
  // 2. Subida a Supabase
  const nombreArchivo = `${Date.now()}_${idTarea}.jpg`;
  const { error } = await supabase.storage
    .from('evidencias')
    .upload(nombreArchivo, imagenComprimida, {
      contentType: 'image/jpeg'
    });

  if (error) throw new Error(`Error al subir imagen a Supabase: ${error.message}`);

  // 3. Recuperación de la URL pública
  const { data } = supabase.storage.from('evidencias').getPublicUrl(nombreArchivo);
  return data.publicUrl;
};