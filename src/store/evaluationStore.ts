import { create } from 'zustand';

// Definimos la estructura exacta de nuestros datos (TypeScript)
interface EvaluationState {
  score: number;
  decreaseScore: (points: number) => void;
  resetScore: () => void;
}

// Creamos el "store" global
export const useEvaluationStore = create<EvaluationState>((set) => ({
  score: 100, // Todas las evaluaciones parten de 100 puntos
  decreaseScore: (points) => set((state) => ({ score: Math.max(0, state.score - points) })),
  resetScore: () => set({ score: 100 }),
}));