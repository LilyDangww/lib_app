import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  bookId: string;
  title: string;
  author: string;
  availability?: string;
  imageUrl?: string;
  addedAt: number;
}

interface CartState {
  items: CartItem[];
  addItem: (
    item: Omit<CartItem, "addedAt">
  ) => { added: true } | { added: false; reason: "duplicate" };
  removeItem: (bookId: string) => boolean;
  clearCart: () => void;
  hasItem: (bookId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const { items } = get();

        if (items.some((existing) => existing.bookId === item.bookId)) {
          return { added: false, reason: "duplicate" as const };
        }

        set({
          items: [
            ...items,
            {
              ...item,
              addedAt: Date.now(),
            },
          ],
        });

        return { added: true as const };
      },
      removeItem: (bookId) => {
        const { items } = get();
        if (!items.some((existing) => existing.bookId === bookId)) {
          return false;
        }

        set({ items: items.filter((existing) => existing.bookId !== bookId) });
        return true;
      },
      clearCart: () => {
        if (get().items.length === 0) {
          return;
        }
        set({ items: [] });
      },
      hasItem: (bookId) => get().items.some((item) => item.bookId === bookId),
    }),
    {
      name: "freebook-cart",
      partialize: (state) => ({ items: state.items }),
      version: 1,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return window.localStorage;
      }),
    },
  ),
);

export type { CartState };

