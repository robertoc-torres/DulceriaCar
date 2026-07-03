import type { CatalogData, DulceCatalogEntry, Product, ProductId } from "./api";

export interface OrderState {
  product: Product | null;
  size: string;
  shape: string;
  finish: string;
  quantity: number;
  colors: number;
  material: string;
  extras: string[];
  artFileUri: string | null;
  artFileName: string | null;
  artDescription: string;
  colorNotes: string;
  nombre: string;
  empresa: string;
  telefono: string;
  email: string;
  wantsWhatsApp: boolean;
  isSubmitted: boolean;
}

export function createDefaultOrder(catalog: CatalogData): OrderState {
  return {
    product: null,
    size: "",
    shape: "",
    finish: catalog.finishes[0] ?? "",
    quantity: 0,
    colors: 1,
    material: catalog.materialsEtiquetas[0] ?? "",
    extras: [],
    artFileUri: null,
    artFileName: null,
    artDescription: "",
    colorNotes: "",
    nombre: "",
    empresa: "",
    telefono: "",
    email: "",
    wantsWhatsApp: true,
    isSubmitted: false,
  };
}

export function getUnitPrice(order: OrderState, catalog: CatalogData): number {
  if (!order.product) return 0;
  if (order.product.id === "etiquetas") {
    if (!order.size) return 0;
    const base = catalog.etiquetaBasePrices[order.size] ?? 0;
    const colorExtra = (order.colors - 1) * catalog.etiquetaColorSurcharge;
    return base + colorExtra;
  }
  if (order.product.id === "dulces") {
    const entry = (catalog.dulcesCatalog[order.size] ?? []).find((e) => e.tipo === order.shape);
    return entry?.precioBolsa ?? 0;
  }
  return 0;
}

export function getTotal(order: OrderState, catalog: CatalogData, taxRates?: { iva: number; ieps: number }): number {
  const iva = taxRates?.iva ?? 0.16;
  const ieps = taxRates?.ieps ?? 0.08;

  if (!order.product) return 0;
  if (order.product.id === "etiquetas") {
    const subtotal = getUnitPrice(order, catalog);
    return subtotal + subtotal * iva;
  }
  if (order.product.id === "dulces") {
    const entry = (catalog.dulcesCatalog[order.size] ?? []).find((e) => e.tipo === order.shape);
    if (!entry) return 0;
    const bolsas = Math.ceil(order.quantity / 1000);
    const bolsaTotal = bolsas * entry.precioBolsa;
    const impuesto = entry.esChicle ? bolsaTotal * iva : bolsaTotal * ieps;
    const tintaBase = catalog.dulcesTintaPrices[order.colors] ?? 200;
    const tintaIVA = tintaBase * iva;
    return bolsaTotal + impuesto + tintaBase + tintaIVA;
  }
  return 0;
}

export function getDulceEntry(order: OrderState, catalog: CatalogData): DulceCatalogEntry | undefined {
  return (catalog.dulcesCatalog[order.size] ?? []).find((e) => e.tipo === order.shape);
}

export function setProductOnOrder(order: OrderState, product: Product, catalog: CatalogData): OrderState {
  const defaultSize =
    product.id === "etiquetas"
      ? ""
      : (catalog.sizes[product.id][1] ?? catalog.sizes[product.id][0] ?? "");
  return {
    ...order,
    product,
    quantity: product.minQty,
    size: defaultSize,
    shape: catalog.shapes[product.id][0] ?? "",
    finish: catalog.finishes[0] ?? "",
    colors: 1,
    material: catalog.materialsEtiquetas[0] ?? "",
    extras: [],
  };
}

export function fmtNum(n: number) {
  return n.toLocaleString("es-MX");
}

export function fmtMXN(n: number) {
  return `$${n.toFixed(2)}`;
}

export type { ProductId, Product, CatalogData };
