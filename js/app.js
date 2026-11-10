(function () {
  "use strict";

  const UNITS = ["pcs", "poly", "box", "pkt"];
  const body = document.getElementById("product-body");
  const totalEl = document.getElementById("total-amount");
  const totalPdfEl = document.getElementById("total-amount-pdf");
  const wordsEl = document.getElementById("amount-words");
  const memoNo = document.getElementById("memo-no");
  const memoDate = document.getElementById("memo-date");
  const paymentStatus = document.getElementById("payment-status");
  const resetModal = document.getElementById("reset-modal");

  let currentTotal = 0;

  function todayDMY() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${day}-${m}-${d.getFullYear()}`;
  }

  function nextMemoNo() {
    const n = Date.now().toString().slice(-6);
    return `CM-${n}`;
  }

  function round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  function formatMoney(n) {
    return round2(n).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function twoDigits(n) {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o ? " " + ones[o] : "");
  }

  function threeDigits(n) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h && r) return ones[h] + " Hundred " + twoDigits(r);
    if (h) return ones[h] + " Hundred";
    return twoDigits(r);
  }

  function numberToWords(num) {
    num = Math.floor(Math.abs(num));
    if (num === 0) return "Zero";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const rest = num;

    const parts = [];
    if (crore) parts.push(threeDigits(crore) + " Crore");
    if (lakh) parts.push(threeDigits(lakh) + " Lakh");
    if (thousand) parts.push(threeDigits(thousand) + " Thousand");
    if (rest) parts.push(threeDigits(rest));
    return parts.join(" ");
  }

  function amountInWords(amount) {
    const total = round2(amount);
    const taka = Math.floor(total);
    const paisa = Math.round((total - taka) * 100);
    let text = numberToWords(taka) + " Taka";
    if (paisa > 0) text += " and " + numberToWords(paisa) + " Paisa";
    return text + " Only";
  }

  function unitOptions(selected) {
    return UNITS.map(
      (u) => `<option value="${u}"${u === selected ? " selected" : ""}>${u}</option>`
    ).join("");
  }

  function createRow(data = {}) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-sl"><span class="sl-num">1</span></td>
      <td class="col-name">
        <input class="cell" type="text" data-field="name" placeholder="Product name" value="${escapeAttr(data.name || "")}" />
      </td>
      <td class="col-qty">
        <input class="cell num center" type="number" data-field="qty" min="0" step="any" inputmode="decimal" value="${data.qty ?? 1}" />
      </td>
      <td class="col-unit">
        <select class="cell center" data-field="unit">${unitOptions(data.unit || "pcs")}</select>
      </td>
      <td class="col-rate">
        <input class="cell num center" type="number" data-field="rate" min="0" step="any" inputmode="decimal" value="${data.rate ?? ""}" placeholder="0" />
      </td>
      <td class="col-amt"><span class="amt-cell">0.00</span></td>
      <td class="col-act no-print">
        <button type="button" class="icon-btn danger btn-del" title="Delete" aria-label="Delete row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    `;
    return tr;
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function renumber() {
    [...body.querySelectorAll("tr")].forEach((tr, i) => {
      tr.querySelector(".sl-num").textContent = String(i + 1);
      const del = tr.querySelector(".btn-del");
      if (del) del.hidden = i === 0;
    });
  }

  function rowAmount(tr) {
    const qty = Number(tr.querySelector('[data-field="qty"]').value) || 0;
    const rate = Number(tr.querySelector('[data-field="rate"]').value) || 0;
    return round2(qty * rate);
  }

  function recalc() {
    let total = 0;
    [...body.querySelectorAll("tr")].forEach((tr) => {
      const amt = rowAmount(tr);
      tr.querySelector(".amt-cell").textContent = formatMoney(amt);
      total += amt;
    });
    currentTotal = round2(total);
    const money = formatMoney(currentTotal);
    totalEl.textContent = money;
    if (totalPdfEl) totalPdfEl.textContent = money;
    wordsEl.textContent = amountInWords(currentTotal);
  }

  function addRow(data) {
    const tr = createRow(data);
    body.appendChild(tr);
    renumber();
    recalc();
  }

  function resetForm() {
    document.getElementById("client-name").value = "";
    document.getElementById("client-address").value = "";
    document.getElementById("remarks").value = "";
    paymentStatus.value = "fully-paid";
    memoNo.value = nextMemoNo();
    memoDate.value = todayDMY();
    body.innerHTML = "";
    addRow();
  }

  function openResetModal() {
    resetModal.hidden = false;
  }

  function closeResetModal() {
    resetModal.hidden = true;
  }

  document.getElementById("btn-add").addEventListener("click", () => addRow());
  document.getElementById("btn-reset").addEventListener("click", openResetModal);
  document.getElementById("reset-cancel").addEventListener("click", closeResetModal);
  document.getElementById("reset-confirm").addEventListener("click", () => {
    closeResetModal();
    resetForm();
  });
  resetModal.addEventListener("click", (e) => {
    if (e.target === resetModal) closeResetModal();
  });
  body.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-del");
    if (!btn || btn.hidden) return;
    const tr = btn.closest("tr");
    if (tr === body.querySelector("tr")) return;
    tr.remove();
    renumber();
    recalc();
  });

  body.addEventListener("input", (e) => {
    if (e.target.matches("[data-field]")) recalc();
  });

  body.addEventListener("change", (e) => {
    if (e.target.matches("[data-field]")) recalc();
  });

  memoNo.value = nextMemoNo();
  memoDate.value = todayDMY();
  addRow();
})();
