window.addEventListener("DOMContentLoaded", function () {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");

  if (!uploadBtn || !fileInput) {
    console.error("找不到按钮或文件输入框，请检查 HTML 是否包含 id=uploadBtn 和 id=fileInput");
    return;
  }

  uploadBtn.addEventListener("click", async function () {
    const file = fileInput.files[0];
    if (!file) {
      alert("请先选择一张收据图片");
      return;
    }

    try {
      // 获取 Access Token（你需要自己在服务器端处理 CORS）
      const tokenRes = await fetch("https://foundo-smart-api.vercel.app/token");
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("获取 access_token 失败");
      }

      // 转成 base64
      const base64 = await toBase64(file);

      // OCR 识别
      const ocrRes = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `image=${encodeURIComponent(base64)}`,
      });

      const ocrData = await ocrRes.json();
      const words = ocrData.words_result.map(w => w.words).join("\n");

      console.log("识别结果：", words);

      // 简单提取店名、金额、日期
      const storeMatch = words.match(/店名[:：]?\s*(.+)/);
      const amountMatch = words.match(/金额[:：]?\s*(\d+(\.\d+)?)/);
      const dateMatch = words.match(/\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}/);

      const store = storeMatch ? storeMatch[1] : "未知店名";
      const amount = amountMatch ? amountMatch[1] : "未知金额";
      const date = dateMatch ? dateMatch[0] : "未知日期";

      addRow(store, amount, date, "未分类");
    } catch (err) {
      console.error("识别出错：", err);
      alert("识别失败，请检查网络或稍后重试");
    }
  });

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result.split(",")[1];
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function addRow(store, amount, date, category) {
    const table = document.querySelector("table");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${store}</td>
      <td>${amount}</td>
      <td>${date}</td>
      <td>${category}</td>
    `;
    table.appendChild(row);
  }
});
