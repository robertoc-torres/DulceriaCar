import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { getPublicConfig } from "@/lib/api";
import { PageHeader, LoadingScreen } from "@/components/ui";

interface TermSection {
  id: string;
  icon: string;
  title: string;
  items: { label?: string; text: string }[];
}

export default function CondicionesPage() {
  const { data: config, isLoading } = useQuery({ queryKey: ["publicConfig"], queryFn: getPublicConfig });
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <LoadingScreen />;

  const sections = (config?.["terms.conditions"] ?? []) as TermSection[];

  return (
    <div>
      <PageHeader title="Condiciones Comerciales" backTo="/" />
      <div className="px-4 py-4">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-100 rounded-xl mb-2 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(openId === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-sm">{section.title}</span>
              <ChevronDown size={18} className={`transition-transform ${openId === section.id ? "rotate-180" : ""}`} />
            </button>
            {openId === section.id && (
              <div className="px-4 pb-4 space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="text-sm">
                    {item.label && <p className="font-medium text-gray-800">{item.label}</p>}
                    <p className="text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
