import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
    {
      name: "checkup-daily",
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const current = window.localStorage.getItem(name);
          if (current) return current;
          const legacy = window.localStorage.getItem("niramoy-prices");
          if (legacy) window.localStorage.setItem(name, legacy);
          return legacy;
        },
        setItem: (name, value) => {
          if (typeof window !== "undefined") window.localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") window.localStorage.removeItem(name);
        },
      })),
    },
  ),
);

export const bdt = (n: number) =>
  "৳" + Math.round(n).toLocaleString("en-US");
