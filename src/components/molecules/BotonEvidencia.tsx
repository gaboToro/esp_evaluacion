import React from 'react';
import { Button } from '../atoms/Button';
import { useEvidencia } from '../../hooks/useEvidencia';

interface BotonEvidenciaProps {
  idTarea: string;
  onEvidenciaGuardada: (url: string) => void;
}

export const BotonEvidencia: React.FC<BotonEvidenciaProps> = ({ idTarea, onEvidenciaGuardada }) => {
  const { hiddenFileInput, isSubiendo, errorLocal, abrirCamara, procesarCaptura } = useEvidencia(
    idTarea,
    onEvidenciaGuardada
  );

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Input oculto para forzar la apertura de la cámara en dispositivos móviles */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={hiddenFileInput} 
        onChange={procesarCaptura} 
        className="hidden" 
      />
      
      {/* Se reutiliza el átomo Button para mantener la consistencia del diseño */}
      <Button 
        label={isSubiendo ? "PROCESANDO FOTO..." : "NO CUMPLIÓ"} 
        variant="danger" 
        icon={isSubiendo ? "⏳" : "📷"} 
        onClick={abrirCamara} 
        disabled={isSubiendo}
      />

      {errorLocal && <span className="text-xs text-red-500 font-medium text-center">{errorLocal}</span>}
    </div>
  );
};