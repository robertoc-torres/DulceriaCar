const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getPublicConfig() {
  return apiFetch<Record<string, unknown>>("/api/public/config");
}

export function getCatalog() {
  return apiFetch<CatalogData>("/api/public/catalog");
}

export function adminLogin(email: string, password: string) {
  return apiFetch<{ email: string }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function adminLogout() {
  return apiFetch<{ ok: boolean }>("/api/admin/logout", { method: "POST" });
}

export function adminMe() {
  return apiFetch<{ email: string }>("/api/admin/me");
}

export interface ConfigRow {
  key: string;
  value: unknown;
  valueType: string;
  isPublic: boolean;
  description: string | null;
  updatedAt: string;
}

export function adminGetConfig() {
  return apiFetch<ConfigRow[]>("/api/admin/config");
}

export function adminUpdateConfig(key: string, value: unknown) {
  return apiFetch<ConfigRow>(`/api/admin/config/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

export type ProductId = "dulces" | "etiquetas";

export interface Product {
  id: ProductId;
  name: string;
  basePrice: number;
  minQty: number;
}

export interface DulceCatalogEntry {
  tipo: string;
  precioBolsa: number;
  esChicle: boolean;
}

export interface CatalogData {
  products: Record<ProductId, Product>;
  sizes: Record<ProductId, string[]>;
  shapes: Record<ProductId, string[]>;
  dulcesCatalog: Record<string, DulceCatalogEntry[]>;
  dulcesTintaPrices: Record<number, number>;
  etiquetaSizesByShape: Record<string, string[]>;
  etiquetaBasePrices: Record<string, number>;
  etiquetaColorSurcharge: number;
  etiquetaMaxColors: number;
  materialsEtiquetas: string[];
  finishes: string[];
}
