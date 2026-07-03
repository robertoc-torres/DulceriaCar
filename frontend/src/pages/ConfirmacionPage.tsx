import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, MessageCircle } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { useSavedOrders } from "@/hooks/useSavedOrders";
import { getPublicConfig } from "@/lib/api";
import { fmtMXN } from "@/lib/pricing";
import { downloadOrderPDF } from "@/lib/pdf";
import { PageHeader, StepBar, LoadingScreen } from "@/components/ui";

export default function ConfirmacionPage() {
  const { order, catalog, catalogLoading, setContact, submitOrder, resetOrder, getTotal } = useOrder();
  const { addOrder } = useSavedOrders();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const discountPct = Number(params.get("discountPct") ?? 0);
  const discountCode = params.get("discountCode") ?? "";
  const { data: config } = useQuery({ queryKey: ["publicConfig"], queryFn: getPublicConfig });

  const vendedores = (config?.["sales.vendedores"] ?? []) as { label: string; phone: string }[];
  const discountCodes = (config?.["discounts.codes"] ?? {}) as Record<string, { pct: number; label: string }>;

  const [nombre, setNombre] = useState(order.nombre);
  const [empresa, setEmpresa] = useState(order.empresa);
  const [telefono, setTelefono] = useState(order.telefono);
  const [email, setEmail] = useState(order.email);
  const [wantsWhatsApp, setWantsWhatsApp] = useState(order.wantsWhatsApp);
  const [selectedVendedor, setSelectedVendedor] = useState(vendedores[0]?.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (catalogLoading || !catalog) return <LoadingScreen />;

  const baseTotal = getTotal();
  const discountAmount = discountPct ? baseTotal * (discountPct / 100) : 0;
  const finalTotal = baseTotal - discountAmount;
  const isValid = nombre.trim().length > 0 && telefono.trim().length >= 8;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setContact(nombre, empresa, telefono, email, wantsWhatsApp);

    try {
      await new Promise((r) => setTimeout(r, 500));
      if (order.product) {
        await addOrder({
          productId: order.product.id,
          productName: order.product.name,
          size: order.size,
          shape: order.shape,
          finish: order.finish,
          quantity: order.quantity,
          colors: order.colors,
          material: order.material,
          extras: order.extras,
          total: finalTotal,
          nombre,
          empresa,
          telefono,
          wantsWhatsApp,
        });
      }

      downloadOrderPDF(order, catalog, discountPct || undefined);

      const waText = encodeURIComponent(
        `Hola, soy ${nombre}. Te comparto mi pre-orden de *${order.product?.name ?? "Dulcera Car"}*.\nCantidad: ${order.quantity?.toLocaleString("es-MX")} piezas.\nTotal estimado: *$${finalTotal.toFixed(2)} MXN*${discountCode ? ` (código *${discountCode}* −${discountPct}%)` : ""}.\nFavor de confirmar. ¡Gracias!`,
      );
      window.open(`https://wa.me/52${selectedVendedor}?text=${waText}`, "_blank");

      submitOrder();
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <CheckCircle size={64} className="text-green-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">¡Pre-orden enviada!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Te contactaremos en las próximas 24 horas para confirmar tu pedido.
        </p>
        <button
          type="button"
          onClick={() => { resetOrder(); setLocation("/"); }}
          className="btn-primary w-full max-w-xs"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Pre-orden" backTo="/cotizacion" />
      <div className="px-4 py-4 pb-28">
        <StepBar current={4} total={4} />
        <p className="text-xs text-gray-500 mb-4">Paso 4 de 4 — Confirmación</p>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
          <p className="text-sm font-semibold">{order.product?.name}</p>
          <p className="text-2xl font-bold text-primary mt-1">{fmtMXN(finalTotal)}</p>
          {discountCode && (
            <p className="text-xs text-green-600 mt-1">
              {discountCodes[discountCode]?.label ?? `${discountPct}% descuento`}
            </p>
          )}
        </div>

        <p className="font-semibold text-sm mb-3">Tus datos de contacto</p>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre *" className="input-field mb-3" />
        <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa (opcional)" className="input-field mb-3" />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono *" type="tel" className="input-field mb-3" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opcional)" type="email" className="input-field mb-3" />

        <label className="flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" checked={wantsWhatsApp} onChange={(e) => setWantsWhatsApp(e.target.checked)} />
          Prefiero contacto por WhatsApp
        </label>

        <p className="font-semibold text-sm mb-2">Enviar pre-orden a:</p>
        <div className="space-y-2 mb-4">
          {vendedores.map((v) => (
            <button
              key={v.phone}
              type="button"
              onClick={() => setSelectedVendedor(v.phone)}
              className={`w-full text-left p-3 rounded-xl border ${selectedVendedor === v.phone ? "border-primary bg-red-50" : "border-gray-200"}`}
            >
              <p className="font-medium text-sm">{v.label}</p>
              <p className="text-xs text-gray-500">{v.phone}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white border-t border-gray-100">
        <button
          type="button"
          disabled={!isValid || loading}
          onClick={handleSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          {loading ? "Enviando…" : "Enviar por WhatsApp"}
        </button>
      </div>
    </div>
  );
}
