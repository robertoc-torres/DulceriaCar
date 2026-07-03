import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Clock, Edit3, CheckCircle, Gift, Tag, ChevronRight, History, Phone, FileText } from "lucide-react";
import { getPublicConfig } from "@/lib/api";
import { useOrder } from "@/context/OrderContext";
import { useSavedOrders } from "@/hooks/useSavedOrders";
import { LoadingScreen } from "@/components/ui";
import type { ProductId } from "@/lib/pricing";

const GALLERY = [
  { img: "/assets/images/chicles.jpg", name: "Chicles de Frutas", desc: "En Cuadritos" },
  { img: "/assets/images/dulces_tamarindo.jpg", name: "Bola de Tamarindo", desc: "Mango y Piña" },
  { img: "/assets/images/mentas.jpg", name: "Bola Menta Inglesa", desc: "Dulce de menta" },
  { img: "/assets/images/gragea_menta_tamarindo.jpg", name: "Gragea Menta y Tamarindo", desc: "" },
  { img: "/assets/images/etiquetas_closeup.jpg", name: "Etiquetas en Rollo Suajadas", desc: "al Mayoreo" },
];

const BENEFITS = [
  { icon: CheckCircle, label: "Calidad Garantizada", sub: "Productos de la más alta calidad con garantía" },
  { icon: Clock, label: "Entrega Rápida", sub: "Primer pedido en 20-25 días aproximadamente" },
  { icon: Edit3, label: "Diseño Personalizado", sub: "Sube tu logotipo y lo imprimimos en tus productos" },
];

const STEPS = [
  { num: "1", label: "Configurador", desc: "Elige tamaño, forma, acabado y cantidad" },
  { num: "2", label: "Carga de Arte", desc: "Sube tu logotipo o diseño (.AI, .PDF, .PNG)" },
  { num: "3", label: "Cotización", desc: "Ve el desglose de precios por volumen" },
  { num: "4", label: "Pre-orden", desc: "Confirma y te contactamos en 24 hrs" },
];

export default function HomePage() {
  const { catalog, catalogLoading, setProduct } = useOrder();
  const { orders } = useSavedOrders();
  const { data: config } = useQuery({ queryKey: ["publicConfig"], queryFn: getPublicConfig });
  const [, setLocation] = useLocation();

  if (catalogLoading || !catalog) return <LoadingScreen />;

  const heroTitle = (config?.["business.hero_title"] as string) ?? "Haz que tu Marca\nsea el Regalo\nmás Dulce";

  const handleConfigure = (productId: ProductId) => {
    setProduct(catalog.products[productId]);
    setLocation("/configurador");
  };

  return (
    <div className="pb-8">
      <header className="px-4 pt-4 pb-3 border-b border-gray-100">
        <img src="/assets/images/logo.jpg" alt="DULCERA CAR" className="h-14 mx-auto object-contain" />
      </header>

      <section className="px-4 py-6 text-center">
        <h2 className="text-2xl font-bold text-primary whitespace-pre-line leading-tight">{heroTitle}</h2>
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500 tracking-widest">EXPERTOS EN</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="relative rounded-2xl overflow-hidden min-h-[140px] bg-cover bg-center"
            style={{ backgroundImage: "url(/assets/images/dulces-bg.jpeg)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/70 to-primary-dark/80" />
            <div className="relative p-4 text-white text-left h-full flex flex-col justify-end">
              <Gift size={22} className="mb-2" />
              <p className="font-bold text-sm leading-tight">Dulces Promocionales</p>
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 mt-1 inline-block w-fit">Personalizados</span>
            </div>
          </div>
          <div
            className="relative rounded-2xl overflow-hidden min-h-[140px] bg-cover bg-center"
            style={{ backgroundImage: "url(/assets/images/etiquetas-bg.jpeg)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-800/70 to-orange-950/80" />
            <div className="relative p-4 text-white text-left h-full flex flex-col justify-end">
              <Tag size={22} className="mb-2" />
              <p className="font-bold text-sm leading-tight">Etiquetas en Rollo</p>
              <span className="text-xs bg-white/15 rounded-full px-2 py-0.5 mt-1 inline-block w-fit">Cortes de Precisión</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 mb-6">
        <p className="text-xs text-gray-500 tracking-wide mb-1">SELECCIONA UN PRODUCTO.</p>
        <h3 className="text-lg font-bold mb-4">¿Qué deseas fabricar?</h3>

        <button
          type="button"
          onClick={() => handleConfigure("dulces")}
          className="w-full mb-3 rounded-2xl overflow-hidden border border-gray-100 text-left active:opacity-90"
        >
          <img src="/assets/images/chile_dulces.jpg" alt="" className="w-full h-36 object-cover" />
          <div className="p-4">
            <p className="font-bold">{catalog.products.dulces.name}</p>
            <p className="text-sm text-gray-500">Mínimo {catalog.products.dulces.minQty.toLocaleString("es-MX")} piezas</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleConfigure("etiquetas")}
          className="w-full rounded-2xl overflow-hidden border border-gray-100 text-left active:opacity-90"
        >
          <img src="/assets/images/etiquetas_rollo.jpg" alt="" className="w-full h-36 object-cover" />
          <div className="p-4">
            <p className="font-bold">{catalog.products.etiquetas.name}</p>
            <p className="text-sm text-gray-500">Mínimo {catalog.products.etiquetas.minQty.toLocaleString("es-MX")} piezas</p>
          </div>
        </button>
      </section>

      <section className="px-4 mb-6">
        <h3 className="text-lg font-bold mb-3">Galería</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {GALLERY.map((item) => (
            <div key={item.name} className="flex-shrink-0 w-36">
              <img src={item.img} alt={item.name} className="w-36 h-28 object-cover rounded-xl" />
              <p className="text-xs font-semibold mt-1">{item.name}</p>
              {item.desc && <p className="text-xs text-gray-500">{item.desc}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 mb-6">
        <h3 className="text-lg font-bold mb-3">¿Cómo funciona?</h3>
        {STEPS.map((step) => (
          <div key={step.num} className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-xl">
            <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
              {step.num}
            </span>
            <div>
              <p className="font-semibold text-sm">{step.label}</p>
              <p className="text-xs text-gray-500">{step.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="px-4 mb-6">
        {BENEFITS.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex gap-3 mb-3 items-start">
            <Icon size={20} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      <nav className="px-4 grid gap-2">
        <Link href="/galeria-etiquetas" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <span className="font-medium text-sm">Galería de Etiquetas</span>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>
        {orders.length > 0 && (
          <Link href="/pedidos-anteriores" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="font-medium text-sm flex items-center gap-2">
              <History size={16} /> Pedidos anteriores ({orders.length})
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
        )}
        <Link href="/contacto" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <span className="font-medium text-sm flex items-center gap-2">
            <Phone size={16} /> Contáctanos
          </span>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>
        <Link href="/condiciones" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <span className="font-medium text-sm flex items-center gap-2">
            <FileText size={16} /> Condiciones comerciales
          </span>
          <ChevronRight size={18} className="text-gray-400" />
        </Link>
      </nav>

      <footer className="px-4 pt-6 text-center text-xs text-gray-400">
        <p>{(config?.["business.tagline"] as string) ?? "Dulces Personalizados y Etiquetas Suajadas al Mayoreo"}</p>
      </footer>
    </div>
  );
}
