let base64File = "";
let fileType = "";
let extractedData = {};

const fileInput = document.getElementById("fileInput");
const resultContainer = document.getElementById("resultContainer");

// 上传按钮点击
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("请选择图片或 PDF");

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = async () => {
    const result = reader.result;
    fileType = result.split(";")[0].split(":")[1]; // MIME类型：image/jpeg 或 application/pdf
    base64File = result.split(",")[1];

    resultContainer.innerText = "📤 正在上传识别...";

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64: base64File,
          mimeType: fileType
        })
      });

      const data = await extractRes.json();
      if (!data || !data.invoice || !data.amount || !data.date) {
        resultContainer.innerHTML = "❌ 无法识别内容，请上传清晰票据";
        return;
      }

      extractedData = { ...data };
      document.getElementById("noteInput").value = "";
      document.getElementById("confirmModal").style.display = "block";
    } catch (err) {
      resultContainer.innerHTML = "❌ 识别失败：" + err.message;
    }
  };
});

// 品牌联动分类
const brandSelect = document.getElementById("brandSelect");
const categorySelect = document.getElementById("categorySelect");

brandSelect.addEventListener("change", () => {
  const brand = brandSelect.value;
  const options = brand === "RR"
    ? ["supermarket", "AB BAKERY", "TAKA BAKERY", "Cake SP", "Fruit SP", "tools", "others"]
    : ["HD", "HD MILK", "HD Fruit", "supermarket", "tools", "others"];
  categorySelect.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join("");
});
brandSelect.dispatchEvent(new Event("change"));

// 下一步按钮
document.getElementById("nextBtn").addEventListener("click", () => {
  const note = document.getElementById("noteInput").value.trim();
  const brand = brandSelect.value;
  const category = categorySelect.value;

  extractedData.note = note;
  extractedData.brand = brand;
  extractedData.category = category;

  const display = brand === "RR"
    ? [extractedData.invoice, extractedData.date, extractedData.amount, note, "", category]
    : [extractedData.invoice, extractedData.date, extractedData.amount, note, category, ""];

  document.getElementById("confirmDetails").innerText = display.join("\n");
  document.getElementById("confirmModal").style.display = "none";
  document.getElementById("confirmPage").style.display = "block";
});

// 最终确认上传
document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
  const btn = document.getElementById("finalConfirmBtn");
  btn.disabled = true;
  resultContainer.innerText = "📤 正在上传并写入表格...";

  try {
    const uploadRes = await fetch("/api/gsheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...extractedData,
        base64: base64File,
        mimeType: fileType
      })
    });

    const result = await uploadRes.json();
    if (result.status === "ok") {
      resultContainer.innerHTML = "✅ 上传成功！";
    } else {
      resultContainer.innerHTML = "❌ 上传失败：" + result.message;
    }
  } catch (err) {
    resultContainer.innerHTML = "❌ 上传失败：" + err.message;
  }
});
