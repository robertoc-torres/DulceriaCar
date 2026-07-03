import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { getPublicConfig } from "@/lib/api";
import { fmtMXN, fmtNum, getDulceEntry } from "@/lib/pricing";
import { downloadOrderPDF } from "@/lib/pdf";
import { PageHeader, StepBar, LoadingScreen } from "@/components/ui";

export default function CotizacionPage() {
  const { order, catalog, catalogLoading, getUnitPrice, getTotal } = useOrder();
  const [, setLocation] = useLocation();
  const { data: config } = useQuery({ queryKey: ["publicConfig"], queryFn: getPublicConfig });

  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<{ code: string; pct: number; label: string } | null>(null);
  const [discountError, setDiscountError] = useState("");

  if (catalogLoading || !catalog) return <LoadingScreen />;

  const product = order.product;
  const isEtiquetas = product?.id === "etiquetas";
  const isDulces = product?.id === "dulces";
  const total = getTotal();
  const discountCodes = (config?.["discounts.codes"] ?? {}) as Record<string, { pct: number; label: string }>;
  const discountAmount = appliedCode ? total * (appliedCode.pct / 100) : 0;
  const finalTotal = total - discountAmount;

  const handleApplyCode = () => {
    const code = discountInput.trim().replace(/\s+/g, "").toUpperCase();
    if (!code) return;
    const found = discountCodes[code];
    if (found) {
      setAppliedCode({ code, ...found });
      setDiscountError("");
    } else {
      setDiscountError("Código no válido. Intenta de nuevo.");
      setAppliedCode(null);
    }
  };

  const dulceEntry = isDulces ? getDulceEntry(order, catalog) : undefined;
  const bolsas = isDulces ? Math.ceil(order.quantity / 1000) : 0;
  const etiquetaBase = isEtiquetas ? (catalog.etiquetaBasePrices[order.size] ?? 0) : 0;
  const etiquetaColorExtra = isEtiquetas ? (order.colors - 1) * catalog.etiquetaColorSurcharge : 0;

  return (
    <div>
      <PageHeader title="Cotización" backTo="/arte" />
      <div className="px-4 py-4 pb-28">
        <StepBar current={3} total={4} />
        <p className="text-xs text-gray-500 mb-4">Paso 3 de 4 — Cotización</p>

        <div className="border border-gray-100 rounded-2xl p-4 mb-4 bg-white">
          <p className="font-semibold mb-3">Resumen de Pedido</p>
          <Row label="Producto" value={product?.name ?? "—"} />
          {isDulces && (
            <>
              <Row label="Tamaño" value={order.size} />
              <Row label="Tipo de Dulce" value={order.shape} />
              <Row label="Tintas" value={`${order.colors} tinta${order.colors > 1 ? "s" : ""}`} />
            </>
          )}
          {isEtiquetas && (
            <>
              <Row label="Forma" value={order.shape} />
              <Row label="Tamaño" value={order.size} />
              <Row label="Acabado" value={order.finish} />
              <Row label="Colores" value={`${order.colors}`} />
              <Row label="Material" value={order.material} />
            </>
          )}
          <Row label="Cantidad" value={`${fmtNum(order.quantity)} piezas`} />
          {order.artFileName && <Row label="Archivo" value={order.artFileName} />}
        </div>

        <div className="border border-gray-100 rounded-2xl p-4 mb-4 bg-gray-50">
          <p className="font-semibold mb-3">Desglose de Precios</p>
          {isEtiquetas && (
            <>
              <Row label="Precio base (5,000 pzas)" value={fmtMXN(etiquetaBase)} />
              {etiquetaColorExtra > 0 && <Row label="Colores adicionales" value={fmtMXN(etiquetaColorExtra)} />}
              <Row label="Subtotal" value={fmtMXN(getUnitPrice())} />
              <Row label="IVA 16%" value={fmtMXN(getUnitPrice() * 0.16)} />
            </>
          )}
          {isDulces && dulceEntry && (
            <>
              <Row label={`Bolsas (${bolsas} × 1,000 pzas)`} value={fmtMXN(bolsas * dulceEntry.precioBolsa)} />
              <Row label={dulceEntry.esChicle ? "IVA 16%" : "IEPS 8%"} value={fmtMXN(bolsas * dulceEntry.precioBolsa * (dulceEntry.esChicle ? 0.16 : 0.08))} />
              <Row label="Tintas + IVA" value={fmtMXN((catalog.dulcesTintaPrices[order.colors] ?? 200) * 1.16)} />
            </>
          )}
          {appliedCode && <Row label={`Descuento (${appliedCode.code})`} value={`-${fmtMXN(discountAmount)}`} />}
          <div className="flex justify-between pt-3 mt-2 border-t border-gray-200 font-bold text-lg">
            <span>Total estimado</span>
            <span className="text-primary">{fmtMXN(finalTotal)}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="font-semibold text-sm mb-2">Código de descuento</p>
          <div className="flex gap-2">
            <input
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
              placeholder="Ej. DULCE10"
              className="input-field flex-1"
            />
            <button type="button" onClick={handleApplyCode} className="btn-primary px-4">
              Aplicar
            </button>
          </div>
          {discountError && <p className="text-red-500 text-xs mt-1">{discountError}</p>}
          {appliedCode && <p className="text-green-600 text-xs mt-1">{appliedCode.label} aplicado</p>}
        </div>

        <button
          type="button"
          onClick={() => downloadOrderPDF(order, catalog, appliedCode?.pct)}
          className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium mb-4"
        >
          <Download size={16} /> Descargar PDF
        </button>

        <p className="text-xs text-gray-400 text-center">
          Precios estimados. Sujetos a confirmación. Vigencia 15 días.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          onClick={() =>
            setLocation(
              `/confirmacion?discountCode=${appliedCode?.code ?? ""}&discountPct=${appliedCode?.pct ?? 0}`,
            )
          }
          className="btn-primary w-full"
        >
          Continuar a Pre-orden
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right max-w-[55%]">{value}</span>
    </div>
  );
}
