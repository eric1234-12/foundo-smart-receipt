let base64Image = "";
let extractedData = {}; // invoice, date, amount

const fileInput = document.getElementById("fileInput");
const resultContainer = document.getElementById("resultContainer");

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("请选择图片");

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    base64Image = reader.result.split(",")[1];
    resultContainer.innerText = "📤 正在上传识别...";

    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      const data = await extractRes.json();

      if (!data || !data.invoice || !data.amount || !data.date) {
        resultContainer.innerHTML = "❌ 无法识别票据内容，请上传清晰票据";
        return;
      }

      extractedData = data;
      document.getElementById("noteInput").value = "";
      document.getElementById("confirmModal").style.display = "block";
    } catch (err) {
      resultContainer.innerHTML = "❌ 接口请求失败：" + err.message;
    }
  };
});

const brandSelect = document.getElementById("brandSelect");
const categorySelect = document.getElementById("categorySelect");

brandSelect.addEventListener("change", () => {
  const brand = brandSelect.value;
  const options = brand === "RR"
    ? ["supermarket", "AB BAKERY", "TAKA BAKERY", "Cake SP", "Fruit SP", "tools", "others"]
    : ["HD", "HD MILK", "HD Fruit", "supermarket", "tools", "others"];

  categorySelect.innerHTML = options.map(o => `<option value="${o}">${o}</option>`).join("");
});

// 初始化联动一次
brandSelect.dispatchEvent(new Event("change"));

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

document.getElementById("finalConfirmBtn").addEventListener("click", async () => {
  const btn = document.getElementById("finalConfirmBtn");
  btn.disabled = true;
  resultContainer.innerText = "📤 正在上传图片和写入表格...";

  try {
    const uploadRes = await fetch("/api/gsheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...extractedData, base64Image })
    });

    const result = await uploadRes.json();
    if (result.status === "ok") {
      resultContainer.innerHTML = "✅ 上传成功！";
    } else {
      resultContainer.innerHTML = "❌ 上传失败：" + result.message;
    }
  } catch (err) {
    resultContainer.innerHTML = "❌ 上传出错：" + err.message;
  }
});
