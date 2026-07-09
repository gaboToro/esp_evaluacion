import { create } from 'zustand';

interface EvaluationState {
  score: number;
  decreaseScore: (points: number) => void;
  resetScore: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  score: 100, // Ahora partimos del puntaje ideal de 100 puntos
  
  decreaseScore: (points) => set((state) => ({ score: state.score - points })),
  
  resetScore: () => set({ score: 100 }), // Al reiniciar, vuelve a 100
}));