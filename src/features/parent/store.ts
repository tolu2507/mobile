import { create } from 'zustand';

/** Which child the parent is looking at — shared by Reports, Teachers and Wallet tabs. */
export const useSelectedChild = create<{ childId: string | null; setChildId: (id: string) => void }>((set) => ({
  childId: null,
  setChildId: (childId) => set({ childId }),
}));
