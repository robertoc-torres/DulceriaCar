import { jsPDF } from "jspdf";
import type { OrderState } from "./pricing";
import { fmtMXN, fmtNum, getTotal } from "./pricing";
import type { CatalogData } from "./api";

export function downloadOrderPDF(
  order: OrderState,
  catalog: CatalogData,
  discountPct?: number,
) {
  const total = getTotal(order, catalog);
  const discountAmount = discountPct ? total * (discountPct / 100) : 0;
  const finalTotal = total - discountAmount;

  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(211, 47, 47);
  doc.text("DULCERA CAR", 105, y, { align: "center" });
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Pre-orden / Cotización", 105, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  const lines = [
    `Producto: ${order.product?.name ?? "—"}`,
    `Cantidad: ${fmtNum(order.quantity)} piezas`,
    order.size ? `Tamaño: ${order.size}` : "",
    order.shape ? `${order.product?.id === "dulces" ? "Tipo" : "Forma"}: ${order.shape}` : "",
    order.finish ? `Acabado: ${order.finish}` : "",
    order.material ? `Material: ${order.material}` : "",
    `Colores/Tintas: ${order.colors}`,
    `Total estimado: ${fmtMXN(finalTotal)} MXN`,
    discountPct ? `(Descuento ${discountPct}% aplicado)` : "",
    order.nombre ? `Cliente: ${order.nombre}` : "",
    order.telefono ? `Teléfono: ${order.telefono}` : "",
  ].filter(Boolean);

  for (const line of lines) {
    doc.text(line, 20, y);
    y += 7;
  }

  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Precios estimados sujetos a confirmación. Vigencia 15 días.", 20, y);

  doc.save(`pre-orden-dulceracar-${Date.now()}.pdf`);
}
