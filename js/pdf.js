(function () {
  "use strict";

  function waitFrames(n) {
    return new Promise((resolve) => {
      let left = n;
      const step = () => {
        left -= 1;
        if (left <= 0) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  async function downloadPdf() {
    const el = document.getElementById("memo");
    const memoNo = document.getElementById("memo-no");
    const no = (memoNo && memoNo.value.trim()) || "memo";
    const btn = document.getElementById("btn-pdf");

    if (!el || !btn) return;
    if (typeof html2pdf === "undefined") {
      alert("PDF library load হয়নি। Internet connect করে page refresh করুন।");
      return;
    }

    btn.disabled = true;
    document.body.classList.add("exporting");

    await waitFrames(2);
    await new Promise((r) => setTimeout(r, 50));

    const opt = {
      margin: [8, 8, 12, 8],
      filename: `ACME-Cash-Memo_${no}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2.5,
        useCORS: true,
        scrollY: 0,
        backgroundColor: "#ffffff",
        onclone: function (doc) {
          doc.body.classList.add("exporting");
          const sheet = doc.getElementById("memo");
          if (sheet) {
            sheet.style.overflow = "visible";
            sheet.style.paddingBottom = "32px";
          }

          // Plain text instead of native select arrows
          doc.querySelectorAll("select").forEach((sel) => {
            const text = sel.options[sel.selectedIndex]
              ? sel.options[sel.selectedIndex].text
              : sel.value;
            const span = doc.createElement("span");
            span.textContent = text;
            const isCenter = sel.classList.contains("center");
            span.className = "pdf-select-text" + (isCenter ? " center" : "");
            const cs = doc.defaultView.getComputedStyle(sel);
            const isPayment = !!sel.closest(".payment");
            span.style.cssText = [
              "display:flex",
              "align-items:center",
              "justify-content:" + (isCenter ? "center" : "flex-start"),
              "width:100%",
              "box-sizing:border-box",
              "min-height:" + cs.minHeight,
              "padding:" + cs.padding,
              "margin:0",
              "border:none",
              "background:#ffffff",
              "background-color:#ffffff",
              "color:#000000",
              "font-size:15px",
              "font-family:" + cs.fontFamily,
              "font-weight:" + cs.fontWeight,
              "text-align:" + (isCenter ? "center" : "left"),
            ].join(";");
            if (isPayment) {
              span.style.padding = "8px 12px";
              span.style.minHeight = "42px";
              span.style.justifyContent = "flex-start";
              span.style.textAlign = "left";
            }
            sel.parentNode.replaceChild(span, sel);
          });
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    try {
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error(err);
      alert("Could not create the PDF. Please try again.");
    } finally {
      document.body.classList.remove("exporting");
      btn.disabled = false;
    }
  }

  const btn = document.getElementById("btn-pdf");
  if (btn) btn.addEventListener("click", downloadPdf);
})();
