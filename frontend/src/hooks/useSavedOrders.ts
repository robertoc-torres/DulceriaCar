import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dulcera_car:orders";

export interface SavedOrder {
  id: string;
  date: string;
  productId: "dulces" | "etiquetas";
  productName: string;
  size: string;
  shape: string;
  finish: string;
  quantity: number;
  colors: number;
  material: string;
  extras: string[];
  total: number;
  nombre: string;
  empresa: string;
  telefono: string;
  wantsWhatsApp: boolean;
}

function loadAll(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedOrder[];
  } catch {
    return [];
  }
}

function saveAll(orders: SavedOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function useSavedOrders() {
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrders(loadAll());
    setLoading(false);
  }, []);

  const addOrder = useCallback(async (order: Omit<SavedOrder, "id" | "date">) => {
    const newOrder: SavedOrder = {
      ...order,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
    };
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveAll(updated);
      return updated;
    });
    return newOrder;
  }, []);

  const removeOrder = useCallback(async (id: string) => {
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      saveAll(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(async () => {
    setOrders([]);
    saveAll([]);
  }, []);

  return { orders, loading, addOrder, removeOrder, clearAll };
}
