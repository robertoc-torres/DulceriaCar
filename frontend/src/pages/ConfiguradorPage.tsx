import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Minus, Plus } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { PageHeader, StepBar, LoadingScreen } from "@/components/ui";

export default function ConfiguradorPage() {
  const { order, catalog, catalogLoading, setConfig } = useOrder();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const preShape = new URLSearchParams(search).get("preShape");

  const product = order.product;
  const isEtiquetas = product?.id === "etiquetas";
  const isDulces = product?.id === "dulces";

  const [size, setSize] = useState(order.size || (isDulces ? (catalog?.sizes.dulces[1] ?? "") : ""));
  const [shape, setShape] = useState(
    (preShape && catalog?.shapes.etiquetas.includes(preShape) ? preShape : null) ?? order.shape ?? "",
  );
  const [finish, setFinish] = useState(order.finish || catalog?.finishes[0] || "");
  const [qty, setQty] = useState(order.quantity || product?.minQty || 0);
  const [numColors, setNumColors] = useState(order.colors || 1);
  const [material, setMaterial] = useState(order.material || catalog?.materialsEtiquetas[0] || "");

  if (catalogLoading || !catalog || !product) {
    if (!catalogLoading && !product) {
      setLocation("/");
      return null;
    }
    return <LoadingScreen />;
  }

  const minQty = product.minQty;
  const etiquetaSizes = isEtiquetas ? (catalog.etiquetaSizesByShape[shape] ?? []) : [];
  const dulceTipos = isDulces ? (catalog.dulcesCatalog[size] ?? []) : [];

  const handleQtyStep = (dir: 1 | -1) => {
    const step = isDulces ? 1000 : 500;
    setQty(Math.max(minQty, qty + dir * step));
  };

  const canContinue = isEtiquetas
    ? !!size && !!shape && !!finish && !!material && qty >= minQty
    : isDulces
      ? !!size && !!shape && numColors >= 1 && qty >= minQty
      : !!size && !!shape && !!finish && qty >= minQty;

  const handleNext = () => {
    setConfig(size, shape, finish, Math.max(minQty, qty), numColors, material, order.extras);
    setLocation("/arte");
  };

  return (
    <div>
      <PageHeader title="Configurador" backTo="/" />
      <div className="px-4 py-4 pb-28">
        <StepBar current={1} total={4} />
        <p className="text-xs text-gray-500 mb-4">Paso 1 de 4 — {product.name}</p>

        {isEtiquetas && (
          <>
            <p className="font-semibold text-sm mb-2">Forma (Suaje)</p>
            <div className="mb-4">
              {catalog.shapes.etiquetas.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setShape(s); setSize(""); }}
                  className={`chip ${shape === s ? "chip-selected" : "chip-default"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {shape && (
              <>
                <p className="font-semibold text-sm mb-2">Tamaño</p>
                <div className="mb-4">
                  {etiquetaSizes.map((s) => (
                    <button key={s} type="button" onClick={() => setSize(s)} className={`chip ${size === s ? "chip-selected" : "chip-default"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="font-semibold text-sm mb-2">Material</p>
            <div className="mb-4">
              {catalog.materialsEtiquetas.map((m) => (
                <button key={m} type="button" onClick={() => setMaterial(m)} className={`chip ${material === m ? "chip-selected" : "chip-default"}`}>
                  {m}
                </button>
              ))}
            </div>
            <p className="font-semibold text-sm mb-2">Colores de impresión</p>
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => setNumColors(Math.max(1, numColors - 1))} className="w-10 h-10 rounded-lg border flex items-center justify-center">
                <Minus size={16} />
              </button>
              <span className="font-bold text-lg">{numColors}</span>
              <button type="button" onClick={() => setNumColors(Math.min(catalog.etiquetaMaxColors, numColors + 1))} className="w-10 h-10 rounded-lg border flex items-center justify-center">
                <Plus size={16} />
              </button>
            </div>
          </>
        )}

        {isDulces && (
          <>
            <p className="font-semibold text-sm mb-2">Tamaño de Papel</p>
            <div className="mb-4">
              {catalog.sizes.dulces.map((s) => (
                <button key={s} type="button" onClick={() => { setSize(s); setShape(""); }} className={`chip ${size === s ? "chip-selected" : "chip-default"}`}>
                  {s}
                </button>
              ))}
            </div>
            {size && (
              <>
                <p className="font-semibold text-sm mb-2">Tipo de Dulce</p>
                <div className="mb-4">
                  {dulceTipos.map((e) => (
                    <button key={e.tipo} type="button" onClick={() => setShape(e.tipo)} className={`chip ${shape === e.tipo ? "chip-selected" : "chip-default"}`}>
                      {e.tipo}
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="font-semibold text-sm mb-2">Tintas</p>
            <div className="flex items-center gap-3 mb-4">
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" onClick={() => setNumColors(n)} className={`chip ${numColors === n ? "chip-selected" : "chip-default"}`}>
                  {n} tinta{n > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </>
        )}

        {isEtiquetas && (
          <>
            <p className="font-semibold text-sm mb-2">Acabado</p>
            <div className="mb-4">
              {catalog.finishes.map((f) => (
                <button key={f} type="button" onClick={() => setFinish(f)} className={`chip ${finish === f ? "chip-selected" : "chip-default"}`}>
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="font-semibold text-sm mb-2">Cantidad (mín. {minQty.toLocaleString("es-MX")})</p>
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => handleQtyStep(-1)} className="w-10 h-10 rounded-lg border flex items-center justify-center">
            <Minus size={16} />
          </button>
          <input
            type="text"
            value={qty.toLocaleString("es-MX")}
            onChange={(e) => {
              const num = parseInt(e.target.value.replace(/\D/g, ""), 10);
              if (!isNaN(num)) setQty(num);
            }}
            className="input-field text-center flex-1"
          />
          <button type="button" onClick={() => handleQtyStep(1)} className="w-10 h-10 rounded-lg border flex items-center justify-center">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white border-t border-gray-100">
        <button type="button" disabled={!canContinue} onClick={handleNext} className="btn-primary w-full">
          Continuar
        </button>
      </div>
    </div>
  );
}
