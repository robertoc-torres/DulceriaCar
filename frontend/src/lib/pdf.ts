import { jsPDF } from "jspdf";
import type { CatalogData } from "./api";
import type { OrderState } from "./pricing";
import { fmtNum, getDulceEntry, getTotal, getUnitPrice } from "./pricing";
import { LOGO_DATA_URI } from "./logoBase64";

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

function buildSummaryRows(order: OrderState): { label: string; value: string }[] {
  const isDulces = order.product?.id === "dulces";
  const isEtiquetas = order.product?.id === "etiquetas";
  const rows: { label: string; value: string }[] = [
    { label: "Producto", value: order.product?.name ?? "—" },
  ];

  if (isDulces) {
    rows.push({ label: "Tamaño de Papel", value: order.size || "—" });
    rows.push({ label: "Tipo de Dulce", value: order.shape || "—" });
    rows.push({
      label: "Tintas",
      value: `${order.colors} tinta${order.colors > 1 ? "s" : ""}`,
    });
  }

  if (isEtiquetas) {
    rows.push({ label: "Forma (Suaje)", value: order.shape || "—" });
    rows.push({ label: "Tamaño", value: order.size || "—" });
    rows.push({ label: "Acabado", value: order.finish || "—" });
    rows.push({
      label: "Colores",
      value: `${order.colors} color${order.colors > 1 ? "es" : ""}`,
    });
    rows.push({ label: "Material", value: order.material || "—" });
    if (order.extras.length > 0) {
      rows.push({ label: "Extras", value: order.extras.join(", ") });
    }
  }

  rows.push({ label: "Cantidad", value: `${fmtNum(order.quantity)} piezas` });
  if (order.artFileName) rows.push({ label: "Archivo de arte", value: order.artFileName });
  if (order.artDescription) {
    const desc =
      order.artDescription.slice(0, 60) + (order.artDescription.length > 60 ? "…" : "");
    rows.push({ label: "Descripción", value: desc });
  }
  if (order.nombre) rows.push({ label: "Cliente", value: order.nombre });
  if (order.telefono) rows.push({ label: "Teléfono", value: order.telefono });

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

function buildDesgloseHTML(
  order: OrderState,
  catalog: CatalogData,
  ivaRate: number,
  iepsRate: number,
): string {
  const isDulces = order.product?.id === "dulces";
  const isEtiquetas = order.product?.id === "etiquetas";

  if (isDulces) {
    const dulceBolsas = Math.ceil(order.quantity / 1000);
    const dulceEntry = getDulceEntry(order, catalog);
    const base = dulceBolsas * (dulceEntry?.precioBolsa ?? 0);
    const imp = base * (dulceEntry?.esChicle ? ivaRate : iepsRate);
    const tinta = catalog.dulcesTintaPrices[order.colors] ?? 200;
    const tintaIVA = tinta * ivaRate;
    return `
      <tr><td style="padding:6px 12px;font-size:13px;">${dulceBolsas} bolsas × $${dulceEntry?.precioBolsa?.toFixed(2) ?? "0.00"}</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;">$${base.toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;font-size:13px;color:#888;">${dulceEntry?.esChicle ? "IVA 16% (Chicle)" : "IEPS 8% (Dulce)"}</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;color:#888;">$${imp.toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;font-size:13px;">${order.colors} Tinta${order.colors > 1 ? "s" : ""}</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;">$${tinta.toFixed(2)}</td></tr>
      <tr><td style="padding:6px 12px;font-size:13px;color:#888;">IVA 16% (Tinta)</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;color:#888;">$${tintaIVA.toFixed(2)}</td></tr>`;
  }

  if (isEtiquetas) {
    const eBase = catalog.etiquetaBasePrices[order.size] ?? 0;
    const eExtra = (order.colors - 1) * catalog.etiquetaColorSurcharge;
    const eSub = eBase + eExtra;
    const eIVA = eSub * ivaRate;
    return `
      <tr><td style="padding:6px 12px;font-size:13px;">Etiqueta ${order.shape} ${order.size} · 1 color</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;">$${eBase.toFixed(2)}</td></tr>
      ${
        order.colors > 1
          ? `<tr><td style="padding:6px 12px;font-size:13px;">${order.colors - 1} color${order.colors - 1 > 1 ? "es" : ""} adicional${order.colors - 1 > 1 ? "es" : ""}</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;">$${eExtra.toFixed(2)}</td></tr>`
          : ""
      }
      <tr><td style="padding:6px 12px;font-size:13px;color:#888;">IVA 16%</td>
          <td style="padding:6px 12px;text-align:right;font-size:13px;color:#888;">$${eIVA.toFixed(2)}</td></tr>`;
  }

  const subtotal = getUnitPrice(order, catalog);
  return `<tr><td colspan="2" style="padding:8px 12px;font-size:13px;">Total: $${subtotal.toFixed(2)}</td></tr>`;
}

function buildTermsHTML(terms: TermSection[], phones: string[]): string {
  const blocks = terms
    .map((section) => {
      const body = section.items
        .map((item) => {
          const prefix = item.label ? `<b>${item.label}:</b> ` : "";
          return `${prefix}${item.text}`;
        })
        .join(" ");
      return `
    <div class="cond-block">
      <span class="cond-label">${section.title}</span>
      <p class="cond-text">${body}</p>
    </div>`;
    })
    .join("");

  const phoneLine = phones.map((p) => p).join(" · ");

  return `
  <div class="condiciones-page">
    <div class="cond-title">Condiciones Comerciales</div>
    ${blocks}
    <div class="contact">
      TEL. ${phoneLine} &nbsp;·&nbsp; Enviamos a todo México
    </div>
  </div>`;
}

async function buildOrderHTML(
  order: OrderState,
  catalog: CatalogData,
  total: number,
  discountPct: number | undefined,
  pdfConfig: PdfConfig,
): Promise<string> {
  const fecha = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const artDataUri = await readArtDataUri(order);
  const summaryRows = buildSummaryRows(order);
  const filas = summaryRows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px;color:#666;font-size:13px;">${r.label}</td>
     <td style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;">${r.value}</td></tr>`,
    )
    .join("");
  const desglose = buildDesgloseHTML(
    order,
    catalog,
    pdfConfig.ivaRate ?? 0.16,
    pdfConfig.iepsRate ?? 0.08,
  );
  const discountAmount = discountPct ? total * (discountPct / 100) : 0;
  const finalTotal = total - discountAmount;
  const discountRow = discountPct
    ? `<tr>
        <td style="padding:6px 12px;font-size:13px;color:#25A244;font-weight:700;">Descuento ${discountPct}%</td>
        <td style="padding:6px 12px;text-align:right;font-size:13px;color:#25A244;font-weight:700;">-$${discountAmount.toFixed(2)}</td>
      </tr>`
    : "";
  const termsHtml = buildTermsHTML(pdfConfig.terms ?? [], pdfConfig.phones ?? []);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #1a1a1a; }
  .header { background: #D32F2F; color: white; padding: 28px 32px 20px; }
  .header-inner { display: flex; align-items: center; gap: 16px; }
  .logo-img { width: 80px; height: 80px; object-fit: contain; background: white; border-radius: 8px; padding: 4px; }
  .logo-title { font-size: 26px; font-weight: 900; letter-spacing: 1px; margin: 0; }
  .logo-sub { font-size: 12px; opacity: 0.85; margin: 4px 0 0; }
  .doc-title { font-size: 16px; font-weight: 700; margin: 12px 0 2px; opacity: 0.95; }
  .doc-date { font-size: 12px; opacity: 0.75; }
  .body { padding: 24px 32px; }
  .section-title { font-size: 14px; font-weight: 700; color: #D32F2F; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; }
  tr:nth-child(even) { background: #fafafa; }
  .total-row { background: #D32F2F !important; color: white; }
  .total-row td { padding: 12px; font-size: 16px; font-weight: 900; }
  .footer-note { margin-top: 28px; padding: 14px 16px; background: #fff8f8; border-left: 4px solid #D32F2F; font-size: 12px; color: #555; line-height: 1.6; }
  .contact { margin-top: 20px; font-size: 12px; color: #888; text-align: center; }
  .condiciones-page { page-break-before: always; padding: 32px; }
  .cond-title { font-size: 14px; font-weight: 700; color: #D32F2F; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; border-bottom: 2px solid #D32F2F; padding-bottom: 6px; }
  .cond-block { margin-bottom: 12px; }
  .cond-label { font-size: 11px; font-weight: 700; color: #222; display: block; margin-bottom: 2px; }
  .cond-text { font-size: 11px; color: #555; line-height: 1.55; margin: 0; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <img class="logo-img" src="${LOGO_DATA_URI}"/>
      <div>
        <p class="logo-title">${pdfConfig.businessName ?? "DULCERA CAR"}</p>
        <p class="logo-sub">${pdfConfig.tagline ?? "Dulces Promocionales Personalizados · Etiquetas en Rollo"}</p>
        <p class="doc-title">PRE-ORDEN / COTIZACIÓN</p>
        <p class="doc-date">Fecha: ${fecha}</p>
      </div>
    </div>
  </div>
  <div class="body">
    <div class="section-title">Resumen del Pedido</div>
    <table><tbody>${filas}</tbody></table>

    <div class="section-title">Desglose de Precio</div>
    <table>
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666;">Concepto</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666;">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${desglose}
        ${discountRow}
        <tr class="total-row">
          <td>TOTAL ESTIMADO</td>
          <td style="text-align:right;">$${finalTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Diseño Previo Orientativo</div>
    <div style="display:flex;justify-content:center;margin:16px 0 8px;">
      <div style="width:220px;background:white;border:2px solid #e0e0e0;border-radius:14px;overflow:hidden;box-shadow:2px 2px 6px rgba(0,0,0,0.10);">
        <div style="background:#D32F2F;height:34px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:10px;font-weight:bold;letter-spacing:1.5px;">&#10022; DULCERA CAR &#10022;</span>
        </div>
        <div style="padding:20px 16px;display:flex;align-items:center;justify-content:center;min-height:160px;background:#fafafa;">
          ${
            artDataUri
              ? `<img src="${artDataUri}" style="max-width:160px;max-height:140px;object-fit:contain;border-radius:6px;"/>`
              : `<div style="width:160px;height:120px;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:11px;border:1px dashed #ccc;border-radius:6px;text-align:center;padding:8px;">LOGO / ARTE<br/>DEL CLIENTE</div>`
          }
        </div>
        <div style="border-top:1px solid #eee;"></div>
        <div style="background:#222;height:28px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:8px;letter-spacing:0.5px;opacity:0.75;">DULCES PROMOCIONALES PERSONALIZADOS</span>
        </div>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#888;margin:4px 0 16px;">Diseño previo orientativo &middot; El resultado final depende del arte original</p>

    <div class="footer-note">
      ⚠️ Este documento es una PRE-ORDEN estimada. El precio final se confirma al revisar el arte y los detalles del pedido.<br/>
      Tiempo de entrega primer pedido: 20-25 días hábiles aprox. · Envío se cotiza por separado.
    </div>
  </div>

  ${termsHtml}
</body>
</html>`;
}

async function renderHtmlToPdf(html: string, filename: string): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("No se pudo preparar el PDF.");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 800);
  });

  const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  await pdf.html(iframeDoc.body, {
    margin: [0, 0, 0, 0],
    autoPaging: "text",
    width: 612,
    windowWidth: 794,
    html2canvas: { scale: 0.75, useCORS: true, logging: false },
  });

  pdf.save(filename);
  document.body.removeChild(iframe);
}

export async function downloadOrderPDF(
  order: OrderState,
  catalog: CatalogData,
  discountPct?: number,
  config?: Record<string, unknown>,
): Promise<void> {
  const total = getTotal(order, catalog, {
    iva: (config?.["tax.iva_rate"] as number | undefined) ?? 0.16,
    ieps: (config?.["tax.ieps_rate"] as number | undefined) ?? 0.08,
  });
  const pdfConfig = parsePdfConfig(config);
  const html = await buildOrderHTML(order, catalog, total, discountPct, pdfConfig);
  await renderHtmlToPdf(html, `pre-orden-dulceracar-${Date.now()}.pdf`);
}
