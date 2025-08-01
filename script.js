let pendingUploadData = null;

const CATEGORY_MAP = {
  RR: ['supermarket', 'AB BAKERY', 'TAKA BAKERY', 'Cake SP', 'Fruit SP', 'tools', 'others'],
  aunteajenny: ['HD', 'HD MILK', 'HD Fruit', 'supermarket', 'tools', 'others']
};

document.getElementById("brandSelect").addEventListener("change", () => {
  const brand = document.getElementById("brandSelect").value;
  const categories = CATEGORY_MAP[brand] || [];
  const categorySelect = document.getElementById("categorySelect");

  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
});

document.getElementById("paidSelect").addEventListener("change", (e) => {
  document.getElementById("advancePayment").style.display =
    e.target.value === "no" ? "block" : "none";
});

document.getElementById("payerSelect").addEventListener("change", (e) => {
  document.getElementById("otherPayerLabel").style.display =
    e.target.value === "other" ? "block" : "none";
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("请先选择图片文件！");
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    const extractRes = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64 })
    });
    const { date, amount, invoice, products } = await extractRes.json();
    document.getElementById("invoiceInput").value = invoice || "";
    document.getElementById("amountInput").value = amount || "";
    document.getElementById("dateInput").value = date || "";
    document.getElementById("productInput").value = products || "";

    pendingUploadData = {
      invoice, amount, date, product: products, base64, mimeType: file.type
    };

    document.getElementById("confirmModal").style.display = "block";
    document.getElementById("brandSelect").dispatchEvent(new Event("change"));
  };
});

document.getElementById("nextBtn").addEventListener("click", () => {
  const paid = document.getElementById("paidSelect").value;
  let payer = "";
  if (paid === "no") {
    payer = document.getElementById("payerSelect").value;
    if (payer === "other") {
      payer = document.getElementById("otherPayerInput").value.trim();
      if (!payer) return alert("请选择或填写垫付人员！");
    }
  }

  Object.assign(pendingUploadData, {
    invoice: document.getElementById("invoiceInput").value.trim(),
    amount: document.getElementById("amountInput").value.trim(),
    date: document.getElementById("dateInput").value.trim(),
    product: document.getElementById("productInput").value.trim(),
    note: document.getElementById("noteInput").value.trim(),
    brand: document.getElementById("brandSelect").value,
    category: document.getElementById("categorySelect").value,
    paid, payer
  });

  document.getElementById("confirmDetails").textContent = `
发票号：${pendingUploadData.invoice}
金额：${pendingUploadData.amount}
日期：${pendingUploadData.date}
采购产品：${pendingUploadData.product}
付款状态：${paid === "yes" ? "已付款" : "未付款（垫付：" + payer + ")"}
备注：${pendingUploadData.note}
品牌：${pendingUploadData.brand}
类别：${pendingUploadData.category}
  `.trim();

  document.getElementById("confirmModal").style.display = "none";
  document.getElementById("confirmPage").style.display = "block";
});

document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
  if (!pendingUploadData) return;
  console.log("🟡 正准备提交的数据：", pendingUploadData);
  const res = await fetch("/api/gsheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pendingUploadData)
  });
  const result = await res.json();
  if (result.status === "ok") {
    document.getElementById("resultContainer").textContent = "✅ 成功上传：" + pendingUploadData.date;
  } else {
    alert("❌ 上传失败：" + result.message);
  }
  pendingUploadData = null;
});
