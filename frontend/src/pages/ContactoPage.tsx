import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Phone, Truck, Clock } from "lucide-react";
import { getPublicConfig } from "@/lib/api";
import { PageHeader, LoadingScreen } from "@/components/ui";

interface PhoneEntry {
  number: string;
  label: string;
}

export default function ContactoPage() {
  const { data: config, isLoading } = useQuery({ queryKey: ["publicConfig"], queryFn: getPublicConfig });

  if (isLoading) return <LoadingScreen />;

  const phones = (config?.["contact.phones"] ?? []) as PhoneEntry[];
  const waMsg = (config?.["contact.whatsapp_message"] as string) ?? "";
  const hours = (config?.["contact.hours"] as string) ?? "";
  const shipping = (config?.["business.shipping_message"] as string) ?? "Enviamos a todo México";
  const brand = (config?.["business.name"] as string) ?? "DULCERA CAR";
  const tagline = (config?.["business.tagline"] as string) ?? "";

  const openWhatsApp = (number: string) => {
    window.open(`https://wa.me/52${number}?text=${encodeURIComponent(waMsg)}`, "_blank");
  };

  const callPhone = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div>
      <PageHeader title="Contáctanos" backTo="/" />
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <img src="/assets/images/logo.jpg" alt="" className="w-28 h-28 mx-auto object-contain mb-3" />
          <p className="font-bold tracking-widest">{brand}</p>
          <p className="text-sm text-gray-500">{tagline}</p>
        </div>

        <p className="font-semibold mb-3">Teléfonos</p>
        {phones.map((p) => (
          <div key={p.number} className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 mb-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">{p.label}</p>
              <p className="font-bold">{p.number}</p>
            </div>
            <button type="button" onClick={() => openWhatsApp(p.number)} className="bg-[#25D366] text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1">
              <MessageCircle size={14} /> WA
            </button>
            <button type="button" onClick={() => callPhone(p.number)} className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center">
              <Phone size={16} />
            </button>
          </div>
        ))}

        <div className="flex gap-3 p-4 bg-red-50 rounded-xl mb-3">
          <Truck size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{shipping}</p>
            <p className="text-xs text-gray-500">Consulta costos y tiempos por WhatsApp</p>
          </div>
        </div>

        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl mb-6">
          <Clock size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Horario de atención</p>
            <p className="text-xs text-gray-500 whitespace-pre-line">{hours}</p>
          </div>
        </div>

        {phones[0] && (
          <button type="button" onClick={() => openWhatsApp(phones[0].number)} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2">
            <MessageCircle size={20} /> Escríbenos por WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
