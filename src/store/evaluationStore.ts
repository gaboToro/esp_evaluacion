import { create } from 'zustand';

// Definimos qué datos vamos a guardar durante la evaluación
interface EvaluationState {
    score: number;
    decreaseScore: (points: number) => void;
    resetScore: () => void;
}

// Creamos el "store" (estado global)
export const useEvaluationStore = create<EvaluationState>((set) => ({
    score: 80, // Partimos del puntaje ideal de 80 puntos basado en tus hojas de control

    // Función para restar puntos si una tarea no se cumple
    decreaseScore: (points) => set((state) => ({ score: state.score - points })),

    // Función para reiniciar la evaluación para el siguiente turno
    resetScore: () => set({ score: 80 }),
}));