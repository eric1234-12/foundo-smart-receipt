// 你给的“标准产品清单”（会传给后端做匹配）
const CATALOG = [
  "BUTTERMILK CHEESE CAKE PIECES (Unit)",
  "Cranberry cream Cheese (Plastic)(Unit)",
  "RED  BEAN MOCHI BUN(Unit)",
  "Milk Bun(Unit)",
  "Nacho Chicken Slice (Plastic)(Unit)",
  "MAYO DOUBLE CHEESE BUN(Unit)",
  "COFFEE BUN (Unit)",
  "Luo Song Seasalt(Unit)",
  "Luo Song Garlic(Unit)",
  "DUO PAIN AU CHOCOLATE(Unit)",
  "PAIN SUISSE PITACHIO(Unit)",
  "ALMOND CROISSANT(Unit)",
  "FRENCH CROISSANT(Unit)",
  "Rich Chocolate & Caramel Flat Croissant(Unit)",
  "LEMON ZESTY CROISSANT(Unit)",
  "CINNAMON ROLL(Unit)",
  "Rich Chocolate Croffle(Unit)",
  "SMOKED CHICKEN CROISSANT(Unit)",
  "WHITE TOAST(Unit)",
  "Chocolate Supreme Roll(Unit)",
  "Chocolate Croissant(Unit)",
  "Pain Suisse- Praline Chocolate(Unit)",
  "French  Croissant - Flat(Unit)",
  "CROFFLE(Unit)",
  "Muffin- Belgium Chocolate(Unit)",
  "KOREAN SWEET GARLIC BUN(Unit)",
  "Pain Suisse- Hawaiian Chicken(Unit)",
  "Ori Bagel(Unit)"
];

let parsedPayload = null;   // 记录解析后的完整结果（头部信息 + 行项目）
let base64ForUpload = null; // 图片（只传一次给后端，后端上传 Drive，拿到 imageUrl）

const $ = (id) => document.getElementById(id);
const lineTableBody = $("lineTable").querySelector("tbody");

$("uploadBtn").addEventListener("click", async () => {
  const f = $("fileInput").files[0];
  if (!f) {
    $("error").textContent = "请先选择图片";
    return;
  }
  $("error").textContent = "";
  $("status").textContent = "正在识别中...";

  const reader = new FileReader();
  reader.readAsDataURL(f);
  reader.onload = async () => {
    base64ForUpload = reader.result.split(",")[1];

    try {
      const resp = await fetch("/api/extract-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64ForUpload,
          catalog: CATALOG
        })
      });

      const data = await resp.json();
      if (data.error) {
        $("error").textContent = "识别失败：" + data.error;
        $("status").textContent = "";
        return;
      }

      // data = { supplier, invoice, date, payment_method, total_amount, lines: [{product_name_raw, product_name_mapped, quantity, line_total}], ocr_text }
      parsedPayload = data;

      // 填 UI
      $("invInput").value = data.invoice || "";
      $("dateInput").value = data.date || "";
      $("supplierInput").value = data.supplier || "";
      $("totalInput").value = data.total_amount || "";
      $("paymentMethodSelect").value = data.payment_method || "Cash";

      // 渲染行
      lineTableBody.innerHTML = "";
      (data.lines || []).forEach((row, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td><input type="text" class="prod" value="${row.product_name_mapped || row.product_name_raw || ""}"/></td>
          <td><input type="text" class="qty" value="${row.quantity || 1}"/></td>
          <td><input type="text" class="lineTotal" value="${row.line_total || ""}"/></td>
        `;
        lineTableBody.appendChild(tr);
      });

      $("preview").classList.remove("hidden");
      $("status").textContent = "识别完成，请确认后提交。";

    } catch (e) {
      console.error(e);
      $("error").textContent = "提取失败，请重试";
      $("status").textContent = "";
    }
  };
});

$("submitBtn").addEventListener("click", async () => {
  if (!parsedPayload) return;

  // 读取用户确认/修改的值
  parsedPayload.invoice = $("invInput").value.trim();
  parsedPayload.date = $("dateInput").value.trim();
  parsedPayload.supplier = $("supplierInput").value.trim();
  parsedPayload.total_amount = $("totalInput").value.trim();
  parsedPayload.payment_method = $("paymentMethodSelect").value;
  const remark = $("remarkInput").value.trim();

  // 将表格里的值读回到 lines
  const trs = Array.from(lineTableBody.querySelectorAll("tr"));
  const finalLines = trs.map(tr => {
    const prod = tr.querySelector(".prod").value.trim();
    const qty = tr.querySelector(".qty").value.trim();
    const lineTotal = tr.querySelector(".lineTotal").value.trim();
    return {
      product_name: prod,
      quantity: qty,
      line_total: lineTotal
    };
  });

  const payload = {
    invoice: parsedPayload.invoice,
    date: parsedPayload.date,
    supplier: parsedPayload.supplier,
    payment_method: parsedPayload.payment_method,
    total_amount: parsedPayload.total_amount,
    remarks: remark,
    lines: finalLines,
    imageBase64: base64ForUpload // 后端自己决定要不要真的传一次
  };

  $("status").textContent = "正在写入 Google Sheet…";
  $("error").textContent = "";

  try {
    const resp = await fetch("/api/gsheet-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const js = await resp.json();
    if (js.status !== "ok") {
      $("error").textContent = "写入失败：" + (js.message || "");
      $("status").textContent = "";
      return;
    }
    $("status").textContent = "✅ 成功写入";
  } catch (e) {
    console.error(e);
    $("error").textContent = "写入 Google Sheet 失败";
    $("status").textContent = "";
  }
});
