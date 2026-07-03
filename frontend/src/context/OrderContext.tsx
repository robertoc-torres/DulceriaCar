import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCatalog, type CatalogData, type Product } from "@/lib/api";
import {
  createDefaultOrder,
  getTotal,
  getUnitPrice,
  setProductOnOrder,
  type OrderState,
} from "@/lib/pricing";

interface OrderContextValue {
  order: OrderState;
  catalog: CatalogData | undefined;
  catalogLoading: boolean;
  setProduct: (product: Product) => void;
  setConfig: (
    size: string,
    shape: string,
    finish: string,
    quantity: number,
    colors: number,
    material: string,
    extras: string[],
  ) => void;
  setArt: (
    fileUri: string | null,
    fileName: string | null,
    description: string,
    colorNotes: string,
  ) => void;
  setContact: (
    nombre: string,
    empresa: string,
    telefono: string,
    email: string,
    wantsWhatsApp: boolean,
  ) => void;
  submitOrder: () => void;
  resetOrder: () => void;
  getUnitPrice: () => number;
  getTotal: () => number;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["catalog"],
    queryFn: getCatalog,
  });

  const [order, setOrder] = useState<OrderState>(() =>
    catalog ? createDefaultOrder(catalog) : createDefaultOrder({
      products: {} as CatalogData["products"],
      sizes: { dulces: [], etiquetas: [] },
      shapes: { dulces: [], etiquetas: [] },
      dulcesCatalog: {},
      dulcesTintaPrices: {},
      etiquetaSizesByShape: {},
      etiquetaBasePrices: {},
      etiquetaColorSurcharge: 200,
      etiquetaMaxColors: 5,
      materialsEtiquetas: [],
      finishes: [],
    }),
  );

  const value = useMemo<OrderContextValue>(() => ({
    order,
    catalog,
    catalogLoading,
    setProduct: (product) => {
      if (!catalog) return;
      setOrder((prev) => setProductOnOrder(prev, product, catalog));
    },
    setConfig: (size, shape, finish, quantity, colors, material, extras) => {
      setOrder((prev) => ({ ...prev, size, shape, finish, quantity, colors, material, extras }));
    },
    setArt: (fileUri, fileName, artDescription, colorNotes) => {
      setOrder((prev) => ({ ...prev, artFileUri: fileUri, artFileName: fileName, artDescription, colorNotes }));
    },
    setContact: (nombre, empresa, telefono, email, wantsWhatsApp) => {
      setOrder((prev) => ({ ...prev, nombre, empresa, telefono, email, wantsWhatsApp }));
    },
    submitOrder: () => setOrder((prev) => ({ ...prev, isSubmitted: true })),
    resetOrder: () => {
      if (catalog) setOrder(createDefaultOrder(catalog));
    },
    getUnitPrice: () => (catalog ? getUnitPrice(order, catalog) : 0),
    getTotal: () => (catalog ? getTotal(order, catalog) : 0),
  }), [order, catalog, catalogLoading]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
