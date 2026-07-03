import { useLocation } from "wouter";
import { Trash2, RotateCcw } from "lucide-react";
import { useSavedOrders } from "@/hooks/useSavedOrders";
import { useOrder } from "@/context/OrderContext";
import { fmtMXN } from "@/lib/pricing";
import { PageHeader, LoadingScreen } from "@/components/ui";

export default function PedidosPage() {
  const { orders, loading, removeOrder, clearAll } = useSavedOrders();
  const { catalog, catalogLoading, setProduct } = useOrder();
  const [, setLocation] = useLocation();

  if (loading || catalogLoading) return <LoadingScreen />;

  const handleRepeat = (productId: "dulces" | "etiquetas") => {
    if (!catalog) return;
    setProduct(catalog.products[productId]);
    setLocation("/configurador");
  };

  return (
    <div>
      <PageHeader title="Pedidos Anteriores" backTo="/" />
      <div className="px-4 py-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-12">No tienes pre-órdenes guardadas.</p>
        ) : (
          <>
            <div className="flex justify-end mb-3">
              <button type="button" onClick={clearAll} className="text-xs text-red-500 flex items-center gap-1">
                <Trash2 size={14} /> Borrar todo
              </button>
            </div>
            {orders.map((o) => (
              <div key={o.id} className="border border-gray-100 rounded-2xl p-4 mb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-sm">{o.productName}</p>
                    <p className="text-xs text-gray-500">{new Date(o.date).toLocaleDateString("es-MX")}</p>
                  </div>
                  <p className="font-bold text-primary">{fmtMXN(o.total)}</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  {o.quantity.toLocaleString("es-MX")} pzas · {o.nombre}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRepeat(o.productId)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm border border-gray-200 rounded-lg"
                  >
                    <RotateCcw size={14} /> Repetir
                  </button>
                  <button
                    type="button"
                    onClick={() => removeOrder(o.id)}
                    className="px-3 py-2 text-red-500 border border-red-100 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
