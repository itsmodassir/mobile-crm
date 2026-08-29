export function r2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcInvoice(items: any[], isGst: boolean, treatment: string) {
  const lines = items.map((it) => {
    const qty = Number(it.qty) || 0, unit = Number(it.unit_price) || 0;
    const discP = Number(it.discount_percent) || 0, taxP = Number(it.tax_rate) || 0;
    const gross = qty * unit;
    const discount = r2(gross * discP / 100);
    const amount = r2(gross - discount);
    const tax_amount = isGst || taxP ? r2(amount * taxP / 100) : 0;
    return { amount, tax_amount, discount };
  });
  const subtotal = r2(lines.reduce((s, l) => s + l.amount, 0));
  const discount_total = r2(lines.reduce((s, l) => s + l.discount, 0));
  const tax = r2(lines.reduce((s, l) => s + l.tax_amount, 0));
  const total = r2(subtotal + tax);
  let cgst = 0, sgst = 0, igst = 0;
  if (isGst && tax > 0) { if (treatment === "inter") igst = tax; else { cgst = r2(tax / 2); sgst = r2(tax - cgst); } }
  return { subtotal, discount_total, tax, cgst, sgst, igst, total };
}

export function openInvoicePrint(inv: any, company: any) {
  const items = inv.items || [];
  const esc = (s: any) => String(s ?? "").replace(/</g, "&lt;");
  const cur = esc(inv.currency || "INR");
  const gst = !!inv.is_gst;
  const anyDisc = items.some((i: any) => Number(i.discount_percent) > 0);
  const cols = ["Item", gst ? "HSN/SAC" : null, "Qty", "Unit", (anyDisc || gst) ? "Disc" : null, gst ? "GST" : null, "Taxable"].filter(Boolean);
  const head = cols.map((c, i) => `<th style="${i === 0 ? "" : "text-align:right"}">${c}</th>`).join("");
  const rows = items.map((i: any) => {
    const cells = [
      `<td>${esc(i.description) || ""}</td>`,
      gst ? `<td style="text-align:center">${esc(i.hsn_sac) || "—"}</td>` : null,
      `<td style="text-align:right">${i.qty}</td>`,
      `<td style="text-align:right">${i.unit_price}</td>`,
      (anyDisc || gst) ? `<td style="text-align:right">${Number(i.discount_percent) > 0 ? i.discount_percent + "%" : "—"}</td>` : null,
      gst ? `<td style="text-align:right">${Number(i.tax_rate) || 0}%</td>` : null,
      `<td style="text-align:right">${i.amount}</td>`,
    ].filter(Boolean).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  
  const taxLines = gst
    ? (Number(inv.igst) > 0 ? `IGST: ${cur} ${inv.igst}<br/>` : `CGST: ${cur} ${inv.cgst}<br/>SGST: ${cur} ${inv.sgst}<br/>`)
    : (Number(inv.tax) > 0 ? `Tax: ${cur} ${inv.tax}<br/>` : "");
  
  const sellerGstin = inv.seller_gstin || company?.crm_gstin;
  const gstMeta = gst
    ? `<div class="muted" style="margin-top:6px;font-size:12px">${inv.buyer_gstin ? "Buyer GSTIN: " + esc(inv.buyer_gstin) + " · " : ""}${inv.place_of_supply ? "Place of supply: " + esc(inv.place_of_supply) : ""}</div>`
    : "";
    
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(inv.number)}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>body{font-family:Arial,Helvetica,sans-serif;color:#111827;max-width:720px;margin:16px auto;padding:0 16px}
    h1{margin:0 0 2px;font-size:22px}.muted{color:#6b7280}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px}
    th,td{border:1px solid #e5e7eb;padding:8px}th{background:#f3f4f6;text-align:left}.tot{text-align:right;margin-top:12px;font-size:14px}
    .badge{display:inline-block;padding:2px 8px;border-radius:6px;background:#ecfdf5;color:#065f46;font-weight:700;font-size:12px}@media print{.noprint{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div><h1>${esc(company?.crm_company_name) || "Invoice"}</h1><div class="muted">${sellerGstin ? "GSTIN: " + esc(sellerGstin) : ""}</div></div>
      <div style="text-align:right"><div><strong>${gst ? "Tax Invoice " : "Invoice "}${esc(inv.number)}</strong></div><div class="muted">${inv.created_at ? new Date(inv.created_at).toLocaleDateString() : ""}</div><div>Status: <span class="badge">${esc(inv.status)}</span></div></div></div>
    <div style="margin-top:12px" class="muted">Bill to: <strong style="color:#111827">${esc(inv.client_name) || "—"}</strong> ${inv.client_email ? "· " + esc(inv.client_email) : ""}</div>${gstMeta}
    <div style="overflow-x:auto"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="tot">Subtotal: ${cur} ${inv.subtotal}<br/>${Number(inv.discount_total) > 0 ? `Discount: −${cur} ${inv.discount_total}<br/>` : ""}${taxLines}<strong style="font-size:16px">Total: ${cur} ${inv.total}</strong></div>
    ${inv.due_date ? `<p class="muted">Due: ${esc(inv.due_date)}</p>` : ""}${inv.notes ? `<p>${esc(inv.notes)}</p>` : ""}
    <button class="noprint" onclick="window.print()" style="margin-top:20px;padding:12px 18px;border:0;border-radius:8px;background:#059669;color:#fff;font-weight:700;cursor:pointer;width:100%">Print / Save as PDF</button>
    <script>setTimeout(function(){window.print()},400)</script></body></html>`;
  
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); } else { alert("Please allow pop-ups to download the invoice."); }
}
