import { useLocation } from "wouter";
import { useOrder } from "@/context/OrderContext";
import { PageHeader, LoadingScreen } from "@/components/ui";
import type { ProductId } from "@/lib/pricing";

const SHAPES = [
  { shape: "Circular", img: "/assets/images/etiquetas_galeria_hero.jpg", desc: "Etiquetas circulares suajadas" },
  { shape: "Rectangular", img: "/assets/images/etiquetas_sheet.jpg", desc: "Formatos rectangulares variados" },
  { shape: "Ovalado", img: "/assets/images/etiquetas_closeup.jpg", desc: "Etiquetas ovaladas premium" },
  { shape: "Mermelada", img: "/assets/images/etiquetas_rollo.jpg", desc: "Ideal para frascos de mermelada" },
];

export default function GaleriaPage() {
  const { catalog, catalogLoading, setProduct } = useOrder();
  const [, setLocation] = useLocation();

  if (catalogLoading || !catalog) return <LoadingScreen />;

  const handleSelect = (shape: string) => {
    setProduct(catalog.products.etiquetas);
    setLocation(`/configurador?preShape=${encodeURIComponent(shape)}`);
  };

  return (
    <div>
      <PageHeader title="Galería de Etiquetas" backTo="/" />
      <div className="px-4 py-4">
        <p className="text-sm text-gray-500 mb-4">
          Selecciona una forma de suaje para comenzar tu configuración de etiquetas.
        </p>
        <div className="grid gap-4">
          {SHAPES.map((item) => (
            <button
              key={item.shape}
              type="button"
              onClick={() => handleSelect(item.shape)}
              className="text-left rounded-2xl overflow-hidden border border-gray-100 active:opacity-90"
            >
              <img src={item.img} alt={item.shape} className="w-full h-40 object-cover" />
              <div className="p-4">
                <p className="font-bold">{item.shape}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
