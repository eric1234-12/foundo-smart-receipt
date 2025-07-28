// 产品清单（用于匹配）
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

let parsedPayload = null;
let base64ForUpload = null;

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

      parsedPayload = data;

      $("invInput").value = data.invoice || "";
      $("dateInput").value = data.date || "";
      $("supplierInput").value = data.supplier || "";
      $("totalInput").value = data.total_amount || "";
      $("paymentMethodSelect").value = data.payment_method || "Cash";

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

  parsedPayload.invoice = $("invInput").value.trim();
  parsedPayload.date = $("dateInput").value.trim();
  parsedPayload.supplier = $("supplierInput").value.trim();
  parsedPayload.total_amount = $("totalInput").value.trim();
  parsedPayload.payment_method = $("paymentMethodSelect").value;
  const remark = $("remarkInput").value.trim();

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

  $("status").textContent = "正在上传图片到 Google Drive…";

  let imgurl = "";
  try {
    const uploadResp = await fetch("/api/gsheet-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uploadOnly: true,
        base64: base64ForUpload,
        mimeType: "image/jpeg",
        filename: `invoice_${Date.now()}.jpg`
      })
    });
    const uploadJson = await uploadResp.json();
    if (uploadJson.status === "ok") {
      imgurl = uploadJson.imageUrl;
    } else {
      throw new Error(uploadJson.message);
    }
  } catch (err) {
    $("error").textContent = "图片上传失败：" + err.message;
    $("status").textContent = "";
    return;
  }

  const rows = finalLines.map((line) => ({
    invoice: parsedPayload.invoice,
    date: parsedPayload.date,
    supplier: parsedPayload.supplier,
    product_name: line.product_name,
    quantity: line.quantity,
    line_total: line.line_total,
    payment_method: parsedPayload.payment_method,
    remarks: remark,
    imgurl: imgurl,
    timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
  }));

  const finalPayload = {
    appendBatch: true,
    rows
  };

  $("status").textContent = "正在写入 Google Sheet…";
  $("error").textContent = "";

  try {
    const resp = await fetch("/api/gsheet-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalPayload)
    });
    const js = await resp.json();
    if (js.status !== "ok") {
      $("error").textContent = "写入失败：" + (js.message || "");
      $("status").textContent = "";
      return;
    }
    $("status").textContent = "✅ 成功写入 " + js.count + " 行";
  } catch (e) {
    console.error(e);
    $("error").textContent = "写入 Google Sheet 失败";
    $("status").textContent = "";
  }
});
