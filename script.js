// ✅ script.js (前端逻辑)
let pendingUploadData = null;

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
        body: JSON.stringify({ imageBase64 })
      });

      const { date, amount, invoice, error } = await extractRes.json();

      if (error) {
        alert("识别失败: " + error);
        return;
      }

      if (!amount || !date) {
        alert("识别不到金额或日期，请上传清晰的票据！");
        return;
      }

      pendingUploadData = {
        amount,
        date,
        invoice,
        imageBase64
      };

      document.getElementById("modalText").textContent =
        `系统识别如下内容:\n📅 日期: ${date}\n💰 金额: ${amount}${invoice ? `\n🧾 发票号: ${invoice}` : ""}`;
      document.getElementById("confirmModal").style.display = "block";

    } catch (err) {
      alert("提取字段失败！");
      console.error(err);
    }
  };
});

document.getElementById("confirmBtn").addEventListener("click", async () => {
  if (!pendingUploadData) return;

  const note = document.getElementById("noteInput").value || "";
  const category = document.getElementById("categorySelect").value;

  try {
    await fetch("/api/gsheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pendingUploadData,
        note,
        category
      })
    });

    document.getElementById("resultContainer").innerHTML = `✅ 成功 - ${pendingUploadData.date}`;
    document.getElementById("confirmModal").style.display = "none";
    pendingUploadData = null;

  } catch (err) {
    alert("同步 Google Sheet 失败");
    console.error(err);
  }
});
