import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save } from "lucide-react";
import { adminGetConfig, adminLogout, adminMe, adminUpdateConfig, type ConfigRow } from "@/lib/api";
import { LoadingScreen, ErrorScreen } from "@/components/ui";

export default function AdminConfigPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [message, setMessage] = useState("");

  const { data: me, isLoading: meLoading, error: meError } = useQuery({
    queryKey: ["adminMe"],
    queryFn: adminMe,
    retry: false,
  });

  const { data: config, isLoading } = useQuery({
    queryKey: ["adminConfig"],
    queryFn: adminGetConfig,
    enabled: !!me,
  });

  useEffect(() => {
    if (meError) setLocation("/admin/login");
  }, [meError, setLocation]);

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => adminUpdateConfig(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminConfig"] });
      queryClient.invalidateQueries({ queryKey: ["publicConfig"] });
      queryClient.invalidateQueries({ queryKey: ["catalog"] });
      setEditingKey(null);
      setMessage("Guardado correctamente");
      setTimeout(() => setMessage(""), 3000);
    },
  });

  const handleLogout = async () => {
    await adminLogout();
    setLocation("/admin/login");
  };

  const startEdit = (row: ConfigRow) => {
    setEditingKey(row.key);
    setEditValue(
      typeof row.value === "string" ? row.value : JSON.stringify(row.value, null, 2),
    );
  };

  const saveEdit = (row: ConfigRow) => {
    let parsed: unknown = editValue;
    if (row.valueType === "json") {
      try {
        parsed = JSON.parse(editValue);
      } catch {
        setMessage("JSON inválido");
        return;
      }
    } else if (row.valueType === "number") {
      parsed = Number(editValue);
    } else if (row.valueType === "boolean") {
      parsed = editValue === "true";
    }
    updateMutation.mutate({ key: row.key, value: parsed });
  };

  if (meLoading || isLoading) return <LoadingScreen />;
  if (!me) return <ErrorScreen message="No autorizado" />;

  return (
    <div className="pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-white">
        <div>
          <p className="font-semibold text-sm">Configuración</p>
          <p className="text-xs text-gray-500">{me.email}</p>
        </div>
        <button type="button" onClick={handleLogout} className="text-gray-500 p-2">
          <LogOut size={18} />
        </button>
      </header>

      {message && (
        <p className="mx-4 mt-3 text-sm text-green-600 bg-green-50 p-2 rounded-lg">{message}</p>
      )}

      <div className="px-4 py-4 space-y-3">
        {config?.map((row) => (
          <div key={row.key} className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="font-mono text-xs text-primary">{row.key}</p>
                {row.description && <p className="text-xs text-gray-500">{row.description}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${row.isPublic ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {row.isPublic ? "público" : "privado"}
              </span>
            </div>

            {editingKey === row.key ? (
              <div className="mt-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="input-field min-h-[120px] font-mono text-xs resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => saveEdit(row)} className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm py-2">
                    <Save size={14} /> Guardar
                  </button>
                  <button type="button" onClick={() => setEditingKey(null)} className="px-4 py-2 border rounded-xl text-sm">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEdit(row)}
                className="mt-2 w-full text-left text-xs font-mono bg-gray-50 p-2 rounded-lg truncate text-gray-600"
              >
                {typeof row.value === "string" ? row.value : JSON.stringify(row.value).slice(0, 120)}…
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
