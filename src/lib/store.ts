import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "en" | "bn";

interface AppState {
  lang: Lang;
  thana: string;
  cart: string[]; // test ids
  setLang: (l: Lang) => void;
  setThana: (t: string) => void;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lang: "en",
      thana: "Dhanmondi",
      cart: [],
      setLang: (lang) => set({ lang }),
      setThana: (thana) => set({ thana }),
      addToCart: (id) =>
        set((s) => (s.cart.includes(id) ? s : { cart: [...s.cart, id] })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((x) => x !== id) })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: "niramoy-prices" },
  ),
);

export const bdt = (n: number) =>
  "৳" + Math.round(n).toLocaleString("en-US");
