// src/hooks/useEvidencia.ts
import { useState, useRef, ChangeEvent } from 'react';
import { comprimirYSubirEvidencia } from '../services/storageService';

export const useEvidencia = (idTarea: string, onUploadSuccess: (url: string) => void) => {
    const hiddenFileInput = useRef<HTMLInputElement>(null);
    const [isSubiendo, setIsSubiendo] = useState(false);
    const [errorLocal, setErrorLocal] = useState<string | null>(null);

    const abrirCamara = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    };

    const procesarCaptura = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsSubiendo(true);
        setErrorLocal(null);

        try {
            const urlEvidencia = await comprimirYSubirEvidencia(file, idTarea);
            onUploadSuccess(urlEvidencia);
        } catch (error: any) {
            console.error(error);
            setErrorLocal('Fallo en el procesamiento de la evidencia.');
        } finally {
            setIsSubiendo(false);
            // Resetear el input para permitir capturar la misma foto si hubo error
            if (event.target) event.target.value = '';
        }
    };

    return {
        hiddenFileInput,
        isSubiendo,
        errorLocal,
        abrirCamara,
        procesarCaptura
    };
};