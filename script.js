let pendingUploadData = null;

const brandToCategory = {
  "RR": ["supermarket", "AB BAKERY", "TAKA BAKERY", "Cake SP", "Fruit SP", "tools", "others"],
  "Auntea Jenny": ["HD", "HD MILK", "HD Fruit", "supermarket", "tools", "others"]
};

// 初始化二级下拉菜单联动
document.getElementById("brandSelect").addEventListener("change", (e) => {
  const brand = e.target.value;
  const categorySelect = document.getElementById("categorySelect");
  categorySelect.innerHTML = "";

  if (brandToCategory[brand]) {
    brandToCategory[brand].forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  } else {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "请选择品牌";
    categorySelect.appendChild(opt);
  }
});

// 上传并识别
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("请先选择图片文件！");
    return;
  }

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64Image = reader.result.split(",")[1];

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      const { date, amount, invoice, products, error } = await extractRes.json();

      if (error) {
        alert("识别失败: " + error);
        return;
      }

      document.getElementById("invoiceInput").value = invoice || "";
      document.getElementById("amountInput").value = amount || "";
      document.getElementById("dateInput").value = date || "";
      document.getElementById("productInput").value = products || "";

      pendingUploadData = {
        invoice: invoice || "",
        amount: amount || "",
        date: date || "",
        product: products || "",
        imageBase64: base64Image
      };

      document.getElementById("confirmModal").style.display = "block";
    } catch (err) {
      alert("提取字段失败！");
      console.error("❌ 提取异常:", err);
    }
  };
});

// 显示垫付人选项
document.getElementById("paidSelect").addEventListener("change", (e) => {
  document.getElementById("advancePayment").style.display =
    e.target.value === "no" ? "block" : "none";
});

document.getElementById("payerSelect").addEventListener("change", (e) => {
  document.getElementById("otherPayerLabel").style.display =
    e.target.value === "other" ? "block" : "none";
});

// 下一步确认
document.getElementById("nextBtn").addEventListener("click", () => {
  if (!pendingUploadData) return;

  const paid = document.getElementById("paidSelect").value;
  let payer = "";
  if (paid === "no") {
    payer = document.getElementById("payerSelect").value;
    if (payer === "other") {
      payer = document.getElementById("otherPayerInput").value.trim();
      if (!payer) {
        alert("请选择或填写垫付人员！");
        return;
      }
    }
  }

  pendingUploadData = {
    invoice: document.getElementById("invoiceInput").value.trim(),
    amount: document.getElementById("amountInput").value.trim(),
    date: document.getElementById("dateInput").value.trim(),
    product: document.getElementById("productInput").value.trim(),
    paid,
    payer,
    note: document.getElementById("noteInput").value.trim(),
    brand: document.getElementById("brandSelect").value,
    category: document.getElementById("categorySelect").value,
    imageBase64: pendingUploadData?.imageBase64 || ""
  };

  const details = `
发票号：${pendingUploadData.invoice}
金额：${pendingUploadData.amount}
日期：${pendingUploadData.date}
采购产品：${pendingUploadData.product}
付款状态：${paid === "yes" ? "已付款" : "未付款（垫付：" + payer + ")"}
备注：${pendingUploadData.note}
品牌：${pendingUploadData.brand}
类别：${pendingUploadData.category}
  `;
  document.getElementById("confirmDetails").textContent = details;
  document.getElementById("confirmModal").style.display = "none";
  document.getElementById("confirmPage").style.display = "block";
});

// 最终确认提交
document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
  if (!pendingUploadData) return;

  const payload = {
    invoice: pendingUploadData.invoice,
    date: pendingUploadData.date,
    amount: pendingUploadData.amount,
    product: pendingUploadData.product,
    paid: pendingUploadData.paid,
    payer: pendingUploadData.payer,
    note: pendingUploadData.note,
    brand: pendingUploadData.brand,
    category: pendingUploadData.category,
    imageBase64: pendingUploadData.imageBase64
  };

  try {
    console.log("提交的数据：", payload);
    const resp = await fetch("/api/gsheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      throw new Error("同步失败");
    }

    document.getElementById("resultContainer").innerHTML = `✅ 成功 - ${payload.date}`;
    document.getElementById("confirmPage").style.display = "none";
    pendingUploadData = null;
  } catch (err) {
    alert("同步 Google Sheet 失败");
    console.error(err);
  }
});
