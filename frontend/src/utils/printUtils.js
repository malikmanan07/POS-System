/**
 * Opens a clean print window with only the specified HTML content.
 * No navbar, sidebar, or background app content prints.
 */
export function printWindow(htmlContent, title = "Print") {
  const printDoc = window.open("", "_blank", "width=800,height=700");
  if (!printDoc) {
    alert("Please allow popups to print.");
    return;
  }

  printDoc.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #111;
      font-size: 13px;
      padding: 24px;
    }
    .print-header {
      text-align: center;
      border-bottom: 2px solid #111;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .print-header h1 { font-size: 20px; font-weight: 700; }
    .print-header p { color: #555; font-size: 12px; margin-top: 4px; }

    .sale-block {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .sale-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      gap: 12px;
    }
    .sale-id { font-weight: 700; font-size: 14px; }
    .sale-date { color: #666; font-size: 11px; margin-top: 2px; }
    .sale-total { text-align: right; }
    .sale-total .amount { font-weight: 700; font-size: 16px; color: #000; }
    .sale-total .paid { color: #2a7d4f; font-size: 11px; margin-top: 2px; }
    .sale-total .change { color: #0070bb; font-size: 11px; }

    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #f4f4f4; }
    th {
      text-align: left;
      padding: 6px 10px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      border-bottom: 1px solid #ddd;
    }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }

    .product-thumb {
      width: 32px; height: 32px;
      border-radius: 4px;
      object-fit: cover;
      vertical-align: middle;
      margin-right: 6px;
    }
    .product-initial {
      display: inline-flex;
      align-items: center; justify-content: center;
      width: 32px; height: 32px;
      background: #e8edf5;
      border-radius: 4px;
      font-weight: 700;
      font-size: 13px;
      color: #3b5bdb;
      vertical-align: middle;
      margin-right: 6px;
    }

    .receipt-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .receipt-divider { border-top: 1px solid #ddd; margin: 8px 0; }
    .receipt-total { font-weight: 700; font-size: 15px; }

    .print-footer {
      text-align: center;
      margin-top: 28px;
      font-size: 11px;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 12px;
    }

    @media print {
      body { padding: 10px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  ${htmlContent}
  <div class="print-footer">Printed on ${new Date().toLocaleString()}</div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);

  printDoc.document.close();
}

/**
 * Generates HTML for a customer purchase history print.
 */
export function buildHistoryPrintHTML(customer, history, currency = "$", settings = {}) {
  const biz = settings.business || {};
  const inv = settings.invoice || {};

  const salesHTML = history.map(sale => {
    const itemsHTML = sale.items.map(item => `
          <tr>
            <td>
              ${item.image
        ? `<img src="${item.image}" class="product-thumb" />`
        : `<span class="product-initial">${item.name.charAt(0)}</span>`
      }
              ${item.name}
            </td>
            <td class="center">${item.qty}</td>
            <td class="right">${currency}${parseFloat(item.price).toFixed(2)}</td>
            <td class="right"><strong>${currency}${parseFloat(item.line_total).toFixed(2)}</strong></td>
          </tr>`).join("");

    return `
        <div class="sale-block">
          <div class="sale-meta">
            <div>
              <div class="sale-id">Sale ${inv.prefix || "#"}${sale.id}${inv.suffix || ""}</div>
              <div class="sale-date">${new Date(sale.created_at).toLocaleString()}</div>
            </div>
            <div class="sale-total">
              <div class="amount">${currency}${parseFloat(sale.total).toFixed(2)}</div>
              <div class="paid">Paid: ${currency}${parseFloat(sale.paid_amount).toFixed(2)} (${sale.payment_method})</div>
              ${sale.payment_reference ? `<div class="paid" style="color:#666">Ref: ${sale.payment_reference}</div>` : ""}
              ${parseFloat(sale.change_amount) > 0
        ? `<div class="change">Change: ${currency}${parseFloat(sale.change_amount).toFixed(2)}</div>`
        : ""}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th class="center">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHTML}</tbody>
          </table>
        </div>`;
  }).join("");

  return `
      <div class="print-header">
        <h1>${biz.storeName || "Purchase History"}</h1>
        ${biz.address ? `<p>${biz.address}</p>` : ""}
        ${biz.phone ? `<p>Phone: ${biz.phone}</p>` : ""}
        <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px;">
          <p>Customer: <strong>${customer.name}</strong>${customer.phone ? " &nbsp;|&nbsp; " + customer.phone : ""}${customer.email ? " &nbsp;|&nbsp; " + customer.email : ""}</p>
          <p>${history.length} transaction${history.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>
      ${salesHTML}
      <p style="text-align:center; margin-top:20px; font-size:12px; color:#666;">${inv.footerNote || ""}</p>`;
}

/**
 * Generates HTML for a Sale Details print (from Sales History page).
 */
export function buildSaleDetailsPrintHTML(sale, currency = "$", settings = {}) {
  const biz = settings.business || {};
  const inv = settings.invoice || {};

  const itemsHTML = (sale.items || []).map(item => `
      <tr>
        <td>
          <div style="font-weight:600">${item.product_name}</div>
          <div style="font-size:11px;color:#666">${currency}${parseFloat(item.price).toFixed(2)} / unit</div>
        </td>
        <td class="center">${item.qty}</td>
        <td class="right"><strong>${currency}${parseFloat(item.line_total).toFixed(2)}</strong></td>
      </tr>`).join("");

  return `
      <div class="print-header">
        <h1>${biz.storeName || "Sale Receipt"}</h1>
        ${biz.address ? `<p>${biz.address}</p>` : ""}
        ${biz.phone ? `<p>Phone: ${biz.phone}</p>` : ""}
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
          <p>Transaction ${inv.prefix || "#"}${sale.id}${inv.suffix || ""}</p>
          ${sale.customer_name ? `<p>Customer: <strong>${sale.customer_name}</strong></p>` : ""}
          <p>${new Date(sale.created_at).toLocaleString()}</p>
        </div>
      </div>
      <div class="sale-block">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="center">Qty</th>
              ${parseFloat(sale.returned_amount || 0) > 0 ? `<th class="center">RE</th>` : ""}
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(sale.items || []).map(item => `
              <tr>
                <td>
                  <div style="font-weight:600">${item.product_name}</div>
                  <div style="font-size:11px;color:#666">${currency}${parseFloat(item.price).toFixed(2)} / unit</div>
                </td>
                <td class="center">${item.qty}</td>
                ${parseFloat(sale.returned_amount || 0) > 0 ? `<td class="center text-danger">-${item.returned_qty || 0}</td>` : ""}
                <td class="right"><strong>${currency}${parseFloat(item.line_total).toFixed(2)}</strong></td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div style="margin-top:14px; border-top:1px solid #ddd; padding-top:10px;">
          <div class="receipt-row" style="color:#555; font-size:12px">
            <span>Subtotal</span>
            <span>${currency}${parseFloat(sale.subtotal || 0).toFixed(2)}</span>
          </div>
          ${parseFloat(sale.tax || 0) > 0 ? `
          <div class="receipt-row" style="color:#555; font-size:12px">
            <span>Tax</span>
            <span>${currency}${parseFloat(sale.tax).toFixed(2)}</span>
          </div>` : ""}
          <div class="receipt-row receipt-total" style="margin-top:8px; padding-top:8px; border-top:2px solid #111;">
            <span>Grand Total${parseFloat(sale.returned_amount || 0) > 0 ? ' (Net)' : ''}</span>
            <span>${currency}${parseFloat(sale.total).toFixed(2)}</span>
          </div>
          ${parseFloat(sale.returned_amount || 0) > 0 ? `
          <div class="receipt-row" style="color:#dc3545; font-size:12px; margin-top:4px; font-weight:bold">
            <span>Total Refunded</span>
            <span>-${currency}${parseFloat(sale.returned_amount).toFixed(2)}</span>
          </div>` : ""}
          ${sale.paid_amount ? `
          <div class="receipt-row" style="color:#2a7d4f; font-size:12px; margin-top:4px">
            <span>Paid (${sale.payment_method || "cash"})</span>
            <span>${currency}${parseFloat(sale.paid_amount).toFixed(2)}</span>
          </div>` : ""}
          ${sale.payment_reference ? `
          <div class="receipt-row" style="color:#666; font-size:11px; margin-top:2px">
            <span>Payment Ref</span>
            <span>${sale.payment_reference}</span>
          </div>` : ""}
          ${parseFloat(sale.change_amount || 0) > 0 ? `
          <div class="receipt-row" style="color:#0070bb; font-size:12px">
            <span>Change Given</span>
            <span>${currency}${parseFloat(sale.change_amount).toFixed(2)}</span>
          </div>` : ""}
        </div>
      </div>
      <p style="text-align:center; margin-top:20px; font-size:13px; color:#555;">${inv.footerNote || "Thank you for your purchase!"}</p>`;
}

/**
 * Generates HTML for a POS receipt print (after checkout).
 */
export function buildReceiptPrintHTML(sale, currency = "$", settings = {}) {
  const biz = settings.business || {};
  const inv = settings.invoice || {};

  const itemsHTML = (sale.items || []).map(item => `
      <div class="receipt-row">
        <span>${item.qty}x ${item.name}</span>
        <span>${currency}${parseFloat(item.line_total).toFixed(2)}</span>
      </div>`).join("");

  return `
      <div class="print-header">
        <h1>${biz.storeName || "Sale Receipt"}</h1>
        ${biz.address ? `<p>${biz.address}</p>` : ""}
        ${biz.phone ? `<p>Phone: ${biz.phone}</p>` : ""}
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
          <p>Transaction ${inv.prefix || "#"}${sale.id}${inv.suffix || ""}</p>
          <p>${new Date(sale.created_at || Date.now()).toLocaleString()}</p>
        </div>
      </div>
      <div class="sale-block">
        ${itemsHTML}
        <div class="receipt-divider"></div>
        <div class="receipt-row receipt-total">
          <span>TOTAL</span>
          <span>${currency}${parseFloat(sale.total || 0).toFixed(2)}</span>
        </div>
        ${sale.paid_amount ? `
        <div class="receipt-row" style="color:#2a7d4f">
          <span>Paid (${sale.payment_method || "cash"})</span>
          <span>${currency}${parseFloat(sale.paid_amount).toFixed(2)}</span>
        </div>` : ""}
        ${sale.payment_reference ? `
        <div class="receipt-row" style="color:#666; font-size:11px; margin-top:2px">
          <span>Ref</span>
          <span>${sale.payment_reference}</span>
        </div>` : ""}
        ${parseFloat(sale.change_amount || 0) > 0 ? `
        <div class="receipt-row" style="color:#0070bb">
          <span>Change</span>
          <span>${currency}${parseFloat(sale.change_amount).toFixed(2)}</span>
        </div>` : ""}
      </div>
      <p style="text-align:center; margin-top:16px; font-size:13px; color:#555;">${inv.footerNote || "Thank you for your purchase!"}</p>`;
}
