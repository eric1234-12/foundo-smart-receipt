$("submitBtn").addEventListener("click", async () => {
  if (!parsedPayload) return;

  // 通用信息
  const invoice = $("invInput").value.trim();
  const date = $("dateInput").value.trim();
  const supplier = $("supplierInput").value.trim();
  const total_amount = $("totalInput").value.trim();
  const payment_method = $("paymentMethodSelect").value;
  const remark = $("remarkInput").value.trim();

  const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" });

  const trs = Array.from(lineTableBody.querySelectorAll("tr"));
  const finalLines = trs.map(tr => {
    const product = tr.querySelector(".prod").value.trim();
    const quantity = tr.querySelector(".qty").value.trim();
    const amount = tr.querySelector(".lineTotal").value.trim();
    return {
      invoice,
      date,
      supplier,
      product,
      quantity,
      amount,
      paymentMethod: payment_method,
      remarks: remark,
      imgurl: parsedPayload.image_url || "",  // 你要确保 extract-lines 接口返回这个字段
      timestamp
    };
  });

  $("status").textContent = "正在写入 Google Sheet…";
  $("error").textContent = "";

  try {
    const resp = await fetch("/api/gsheet-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalLines)  // 🔁 这里是数组形式
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
