import { useState } from "react";
import { useLocation } from "wouter";
import { Upload } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { PageHeader, StepBar } from "@/components/ui";

const COLOR_OPTIONS = [
  "Rojo", "Azul", "Verde", "Amarillo", "Negro", "Blanco",
  "Dorado", "Plateado", "Naranja", "Rosa", "Morado",
];

export default function ArtePage() {
  const { order, setArt } = useOrder();
  const [, setLocation] = useLocation();

  const [fileUri, setFileUri] = useState<string | null>(order.artFileUri);
  const [fileName, setFileName] = useState<string | null>(order.artFileName);
  const [description, setDescription] = useState(order.artDescription);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const handlePickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".ai,.pdf,.png,.jpg,.jpeg,.eps,image/*,application/pdf";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        setFileUri(URL.createObjectURL(file));
        setFileName(file.name);
      }
    };
    input.click();
  };

  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const handleNext = () => {
    const colorStr = selectedColors.join(", ");
    setArt(fileUri, fileName, description, colorStr);
    setLocation("/cotizacion");
  };

  return (
    <div>
      <PageHeader title="Carga de Arte" backTo="/configurador" />
      <div className="px-4 py-4 pb-28">
        <StepBar current={2} total={4} />
        <p className="text-xs text-gray-500 mb-4">Paso 2 de 4 — Arte y Diseño</p>

        <p className="font-semibold text-sm mb-2">Logotipo o Diseño</p>
        <button
          type="button"
          onClick={handlePickFile}
          className={`w-full border-2 border-dashed rounded-2xl p-8 mb-4 text-center ${fileUri ? "border-primary bg-red-50" : "border-gray-200 bg-gray-50"}`}
        >
          {fileUri ? (
            <div>
              <p className="font-medium text-sm text-primary">{fileName}</p>
              <p className="text-xs text-gray-500 mt-1">Toca para cambiar archivo</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload size={32} />
              <p className="text-sm">Sube tu archivo (.AI, .PDF, .PNG)</p>
            </div>
          )}
        </button>

        <p className="font-semibold text-sm mb-2">Descripción del diseño</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe tu diseño, colores corporativos, etc."
          className="input-field min-h-[100px] mb-4 resize-none"
        />

        <p className="font-semibold text-sm mb-2">Colores del diseño (opcional)</p>
        <div className="mb-4">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleColor(c)}
              className={`chip ${selectedColors.includes(c) ? "chip-selected" : "chip-default"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {!fileUri && (
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl p-3">
            Si no puedes subir el archivo ahora, podrás enviarlo por WhatsApp al confirmar tu pedido.
          </p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 bg-white border-t border-gray-100">
        <button type="button" onClick={handleNext} className="btn-primary w-full">
          Ver Cotización
        </button>
      </div>
    </div>
  );
}
