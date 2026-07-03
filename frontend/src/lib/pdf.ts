import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { CatalogData } from "./api";
import type { OrderState } from "./pricing";
import { fmtNum, getDulceEntry, getTotal, getUnitPrice } from "./pricing";
import { LOGO_DATA_URI } from "./logoBase64";

const RED: [number, number, number] = [211, 47, 47];
const MARGIN = 15;

interface TermSection {
  id: string;
  title: string;
  items: { label?: string; text: string }[];
}

interface PdfConfig {
  businessName?: string;
  tagline?: string;
  terms?: TermSection[];
  phones?: string[];
  ivaRate?: number;
  iepsRate?: number;
}

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

const LEGACY_TERMS: { title: string; text: string }[] = [
  {
    title: "Mínimos de Pedido",
    text: "Dulces promocionales: mínimo 1,000 piezas por tipo de dulce. Etiquetas en rollo: mínimo 1,000 etiquetas por diseño. No se mezclan diseños para alcanzar el mínimo.",
  },
  {
    title: "Tiempos de Producción",
    text: "Primer pedido: 20–25 días hábiles. Reorden (mismo arte): 15–18 días hábiles. Los tiempos inician una vez aprobado el arte y recibido el anticipo. En temporada alta (Navidad, San Valentín, Día de Muertos) los tiempos pueden extenderse 5–10 días adicionales.",
  },
  {
    title: "Arte y Diseño",
    text: "El cliente debe proporcionar arte en formato vectorial (AI, EPS, PDF) o imagen de alta resolución (mínimo 300 dpi). Se envía una prueba digital para aprobación antes de imprimir. La producción inicia hasta recibir aprobación por escrito. Cambios menores pueden generar costo adicional; diseño desde cero se cotiza por separado.",
  },
  {
    title: "Condiciones de Pago",
    text: "Anticipo y Liquidación: 50% antes de empezar a trabajar en el diseño, y 50% contra entrega en Guadalajara, Jalisco. Para clientes al interior de la República Mexicana, se debe liquidar el 100% antes de empezar a trabajar en el diseño. Formas de pago: Transferencia bancaria, depósito o pago en efectivo. Consultar datos bancarios al confirmar pedido. El pedido no se libera hasta tener el pago completo.",
  },
  {
    title: "Envío y Logística",
    text: "Enviamos a todo México mediante paqueterías de confianza. El costo de envío se cotiza por separado según peso, volumen y destino; no está incluido en el precio de producción. Una vez entregado a la paquetería, el cliente asume la responsabilidad del envío.",
  },
  {
    title: "Modificaciones y Cancelaciones",
    text: "Antes de aprobación de arte se pueden realizar cambios sin costo adicional. Si la producción ya inició, el anticipo no es reembolsable. Si aún no ha iniciado, se evalúa caso por caso.",
  },
  {
    title: "Precios y Vigencia",
    text: "Todos los precios mostrados son estimados y están sujetos a confirmación. Las cotizaciones tienen una vigencia de 15 días naturales. IVA y IEPS: Los precios son más los impuestos aplicables (IVA 16% / IEPS 8%). Pedidos de 20,000 piezas o más en dulces califican para precio especial mayorista. Consultar.",
  },
];

function parsePdfConfig(config?: Record<string, unknown>): PdfConfig {
  if (!config) return {};
  const phones = (config["contact.phones"] as { number: string }[] | undefined)?.map(
    (p) => p.number,
  );
  return {
    businessName: (config["business.name"] as string | undefined) ?? "DULCERA CAR",
    tagline:
      (config["business.tagline"] as string | undefined) ??
      "Dulces Promocionales Personalizados · Etiquetas en Rollo",
    terms: (config["terms.conditions"] as TermSection[] | undefined) ?? [],
    phones: phones ?? ["3313287031", "3331716483", "3311500317"],
    ivaRate: (config["tax.iva_rate"] as number | undefined) ?? 0.16,
    iepsRate: (config["tax.ieps_rate"] as number | undefined) ?? 0.08,
  };
}

function getTermsSections(pdfConfig: PdfConfig): { title: string; text: string }[] {
  if (pdfConfig.terms && pdfConfig.terms.length > 0) {
    return pdfConfig.terms.map((section) => ({
      title: section.title,
      text: section.items
        .map((item) => (item.label ? `${item.label}: ${item.text}` : item.text))
        .join(" "),
    }));
  }
  return LEGACY_TERMS;
}

function buildSummaryRows(order: OrderState): [string, string][] {
  const isDulces = order.product?.id === "dulces";
  const isEtiquetas = order.product?.id === "etiquetas";
  const rows: [string, string][] = [["Producto", order.product?.name ?? "—"]];

  if (isDulces) {
    rows.push(["Tamaño de Papel", order.size || "—"]);
    rows.push(["Tipo de Dulce", order.shape || "—"]);
    rows.push(["Tintas", `${order.colors} tinta${order.colors > 1 ? "s" : ""}`]);
  }

  if (isEtiquetas) {
    rows.push(["Forma (Suaje)", order.shape || "—"]);
    rows.push(["Tamaño", order.size || "—"]);
    rows.push(["Acabado", order.finish || "—"]);
    rows.push(["Colores", `${order.colors} color${order.colors > 1 ? "es" : ""}`]);
    rows.push(["Material", order.material || "—"]);
    if (order.extras.length > 0) {
      rows.push(["Extras", order.extras.join(", ")]);
    }
  }

  rows.push(["Cantidad", `${fmtNum(order.quantity)} piezas`]);
  if (order.artFileName) rows.push(["Archivo de arte", order.artFileName]);
  if (order.artDescription) {
    const desc =
      order.artDescription.slice(0, 60) + (order.artDescription.length > 60 ? "…" : "");
    rows.push(["Descripción", desc]);
  }
  if (order.nombre) rows.push(["Cliente", order.nombre]);
  if (order.telefono) rows.push(["Teléfono", order.telefono]);

  return rows;
}

async function readArtDataUri(order: OrderState): Promise<string> {
  if (!order.artFileUri) return "";
  try {
    if (order.artFileUri.startsWith("data:")) return order.artFileUri;
    const ext = order.artFileName?.split(".").pop()?.toLowerCase() ?? "";
    if (!["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "";
    const res = await fetch(order.artFileUri);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function imageFormatFromDataUri(uri: string): "PNG" | "JPEG" | "WEBP" {
  if (uri.includes("image/png")) return "PNG";
  if (uri.includes("image/webp")) return "WEBP";
  return "JPEG";
}

function buildDesgloseRows(
  order: OrderState,
  catalog: CatalogData,
  ivaRate: number,
  iepsRate: number,
  discountPct: number | undefined,
  total: number,
): [string, string][] {
  const rows: [string, string][] = [];
  const isDulces = order.product?.id === "dulces";
  const isEtiquetas = order.product?.id === "etiquetas";

  if (isDulces) {
    const dulceBolsas = Math.ceil(order.quantity / 1000);
    const dulceEntry = getDulceEntry(order, catalog);
    const base = dulceBolsas * (dulceEntry?.precioBolsa ?? 0);
    const imp = base * (dulceEntry?.esChicle ? ivaRate : iepsRate);
    const tinta = catalog.dulcesTintaPrices[order.colors] ?? 200;
    const tintaIVA = tinta * ivaRate;
    rows.push([
      `${dulceBolsas} bolsas × $${dulceEntry?.precioBolsa?.toFixed(2) ?? "0.00"}`,
      `$${base.toFixed(2)}`,
    ]);
    rows.push([
      dulceEntry?.esChicle ? "IVA 16% (Chicle)" : "IEPS 8% (Dulce)",
      `$${imp.toFixed(2)}`,
    ]);
    rows.push([`${order.colors} Tinta${order.colors > 1 ? "s" : ""}`, `$${tinta.toFixed(2)}`]);
    rows.push(["IVA 16% (Tinta)", `$${tintaIVA.toFixed(2)}`]);
  } else if (isEtiquetas) {
    const eBase = catalog.etiquetaBasePrices[order.size] ?? 0;
    const eExtra = (order.colors - 1) * catalog.etiquetaColorSurcharge;
    const eSub = eBase + eExtra;
    const eIVA = eSub * ivaRate;
    rows.push([
      `Etiqueta ${order.shape} ${order.size} · 1 color`,
      `$${eBase.toFixed(2)}`,
    ]);
    if (order.colors > 1) {
      rows.push([
        `${order.colors - 1} color${order.colors - 1 > 1 ? "es" : ""} adicional${order.colors - 1 > 1 ? "es" : ""}`,
        `$${eExtra.toFixed(2)}`,
      ]);
    }
    rows.push(["IVA 16%", `$${eIVA.toFixed(2)}`]);
  } else {
    const subtotal = getUnitPrice(order, catalog);
    rows.push(["Total", `$${subtotal.toFixed(2)}`]);
  }

  if (discountPct) {
    const discountAmount = total * (discountPct / 100);
    rows.push([`Descuento ${discountPct}%`, `-$${discountAmount.toFixed(2)}`]);
  }

  return rows;
}

function drawHeader(doc: jsPDF, pdfConfig: PdfConfig, fecha: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerH = 42;

  doc.setFillColor(...RED);
  doc.rect(0, 0, pageWidth, headerH, "F");

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN, 7, 28, 28, 2, 2, "F");
  doc.addImage(LOGO_DATA_URI, "JPEG", MARGIN + 1, 8, 26, 26);

  const textX = MARGIN + 34;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(pdfConfig.businessName ?? "DULCERA CAR", textX, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const tagline =
    pdfConfig.tagline ?? "Dulces Promocionales Personalizados · Etiquetas en Rollo";
  doc.text(tagline, textX, 22, { maxWidth: pageWidth - textX - MARGIN });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PRE-ORDEN / COTIZACIÓN", textX, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Fecha: ${fecha}`, textX, 36);

  return headerH + 8;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...RED);
  doc.text(title.toUpperCase(), MARGIN, y);
  doc.setTextColor(30, 30, 30);
  return y + 6;
}

function drawSummaryTable(doc: jsPDF, rows: [string, string][], startY: number): number {
  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    body: rows,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 70, textColor: [102, 102, 102] },
      1: { halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });
  return (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 6;
}

function drawDesgloseTable(
  doc: jsPDF,
  rows: [string, string][],
  finalTotal: number,
  startY: number,
): number {
  const bodyRows = rows.map((row) => {
    const isTax = row[0].includes("IVA") || row[0].includes("IEPS");
    const isDiscount = row[0].startsWith("Descuento");
    return {
      concepto: row[0],
      monto: row[1],
      textColor: (isDiscount ? [37, 162, 68] : isTax ? [136, 136, 136] : [30, 30, 30]) as [
        number,
        number,
        number,
      ],
      fontStyle: isDiscount ? ("bold" as const) : ("normal" as const),
    };
  });

  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Concepto", "Monto"]],
    body: bodyRows.map((r) => [r.concepto, r.monto]),
    theme: "plain",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [102, 102, 102],
      fontSize: 9,
      fontStyle: "bold",
    },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: "right" } },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    didParseCell: (data) => {
      const rowIndex = data.row.index;
      if (data.section === "body" && rowIndex < bodyRows.length) {
        const custom = bodyRows[rowIndex];
        if (custom) {
          data.cell.styles.textColor = custom.textColor;
          data.cell.styles.fontStyle = custom.fontStyle;
        }
      }
    },
  });

  let y = (doc as jsPDFWithAutoTable).lastAutoTable.finalY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const tableWidth = pageWidth - MARGIN * 2;
  doc.setFillColor(...RED);
  doc.rect(MARGIN, y, tableWidth, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL ESTIMADO", MARGIN + 3, y + 7);
  doc.text(`$${finalTotal.toFixed(2)}`, pageWidth - MARGIN - 3, y + 7, { align: "right" });

  return y + 16;
}

function drawMockupCard(doc: jsPDF, artDataUri: string, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const cardW = 58;
  const cardX = (pageWidth - cardW) / 2;
  const headerH = 9;
  const contentH = 42;
  const footerH = 7;
  const cardH = headerH + contentH + footerH;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, startY, cardW, cardH, 3, 3, "FD");

  doc.setFillColor(...RED);
  doc.rect(cardX + 0.2, startY + 0.2, cardW - 0.4, headerH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("* DULCERA CAR *", pageWidth / 2, startY + 6, { align: "center" });

  const contentY = startY + headerH;
  doc.setFillColor(250, 250, 250);
  doc.rect(cardX + 0.2, contentY, cardW - 0.4, contentH, "F");

  if (artDataUri) {
    try {
      const format = imageFormatFromDataUri(artDataUri);
      const imgW = 42;
      const imgH = 32;
      doc.addImage(
        artDataUri,
        format,
        pageWidth / 2 - imgW / 2,
        contentY + 5,
        imgW,
        imgH,
        undefined,
        "FAST",
      );
    } catch {
      drawArtPlaceholder(doc, pageWidth / 2, contentY + contentH / 2);
    }
  } else {
    drawArtPlaceholder(doc, pageWidth / 2, contentY + contentH / 2);
  }

  const footerY = contentY + contentH;
  doc.setFillColor(34, 34, 34);
  doc.rect(cardX + 0.2, footerY, cardW - 0.4, footerH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text("DULCES PROMOCIONALES PERSONALIZADOS", pageWidth / 2, footerY + 4.5, {
    align: "center",
  });

  return startY + cardH + 4;
}

function drawArtPlaceholder(doc: jsPDF, centerX: number, centerY: number): void {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(centerX - 22, centerY - 14, 44, 28, 2, 2, "FD");
  doc.setTextColor(180, 180, 180);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("LOGO / ARTE", centerX, centerY - 2, { align: "center" });
  doc.text("DEL CLIENTE", centerX, centerY + 4, { align: "center" });
}

function drawFooterNote(doc: jsPDF, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentW = pageWidth - MARGIN * 2;
  const note =
    "Este documento es una PRE-ORDEN estimada. El precio final se confirma al revisar el arte y los detalles del pedido.\nTiempo de entrega primer pedido: 20-25 días hábiles aprox. · Envío se cotiza por separado.";
  const lines = doc.splitTextToSize(note, contentW - 8);
  const boxH = lines.length * 4.5 + 8;

  doc.setFillColor(255, 248, 248);
  doc.rect(MARGIN, startY, contentW, boxH, "F");
  doc.setFillColor(...RED);
  doc.rect(MARGIN, startY, 1.5, boxH, "F");

  doc.setTextColor(85, 85, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(lines, MARGIN + 5, startY + 6);

  return startY + boxH + 6;
}

function drawTermsPage(doc: jsPDF, pdfConfig: PdfConfig): void {
  doc.addPage();
  let y = MARGIN + 4;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentW = pageWidth - MARGIN * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...RED);
  doc.text("CONDICIONES COMERCIALES", MARGIN, y);
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 2, pageWidth - MARGIN, y + 2);
  y += 10;

  const sections = getTermsSections(pdfConfig);
  for (const section of sections) {
    if (y > 260) {
      doc.addPage();
      y = MARGIN + 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(34, 34, 34);
    doc.text(section.title, MARGIN, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(85, 85, 85);
    const lines = doc.splitTextToSize(section.text, contentW);
    doc.text(lines, MARGIN, y);
    y += lines.length * 3.8 + 5;
  }

  const phoneLine = `TEL. ${(pdfConfig.phones ?? []).join(" · ")} · Enviamos a todo México`;
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text(phoneLine, pageWidth / 2, 275, { align: "center", maxWidth: contentW });
}

async function generateOrderPDF(
  order: OrderState,
  catalog: CatalogData,
  discountPct: number | undefined,
  pdfConfig: PdfConfig,
): Promise<jsPDF> {
  const fecha = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const artDataUri = await readArtDataUri(order);
  const total = getTotal(order, catalog, {
    iva: pdfConfig.ivaRate ?? 0.16,
    ieps: pdfConfig.iepsRate ?? 0.08,
  });
  const finalTotal = discountPct ? total - total * (discountPct / 100) : total;

  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait" });

  let y = drawHeader(doc, pdfConfig, fecha);

  y = drawSectionTitle(doc, "Resumen del Pedido", y);
  y = drawSummaryTable(doc, buildSummaryRows(order), y);

  y = drawSectionTitle(doc, "Desglose de Precio", y);
  y = drawDesgloseTable(
    doc,
    buildDesgloseRows(
      order,
      catalog,
      pdfConfig.ivaRate ?? 0.16,
      pdfConfig.iepsRate ?? 0.08,
      discountPct,
      total,
    ),
    finalTotal,
    y,
  );

  y = drawSectionTitle(doc, "Diseño Previo Orientativo", y);
  y = drawMockupCard(doc, artDataUri, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text(
    "Diseño previo orientativo · El resultado final depende del arte original",
    doc.internal.pageSize.getWidth() / 2,
    y,
    { align: "center" },
  );
  y += 8;

  if (y > 230) {
    doc.addPage();
    y = MARGIN;
  }
  drawFooterNote(doc, y);

  drawTermsPage(doc, pdfConfig);

  return doc;
}

export async function downloadOrderPDF(
  order: OrderState,
  catalog: CatalogData,
  discountPct?: number,
  config?: Record<string, unknown>,
): Promise<void> {
  const pdfConfig = parsePdfConfig(config);
  const doc = await generateOrderPDF(order, catalog, discountPct, pdfConfig);
  doc.save(`pre-orden-dulceracar-${Date.now()}.pdf`);
}
