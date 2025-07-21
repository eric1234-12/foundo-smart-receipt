document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("请先选择图片文件！");
    return;
  }

  // 获取 access_token
  let accessToken;
  try {
    const tokenRes = await fetch("/api/baidu-token");
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("无法获取 access_token");
  } catch (err) {
    alert("获取百度 token 失败！");
    console.error(err);
    return;
  }

  // 读取图片文件为 base64
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64Image = reader.result.split(",")[1]; // 去掉前缀
    try {
      // 调用百度 VAT Invoice OCR 接口
      const ocrRes = await fetch(` https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `image=${encodeURIComponent(base64Image)}`
      });

      const ocrData = await ocrRes.json();
      if (ocrData.words_result) {
        displayResult(ocrData.words_result);
        // 👉 你可以在这里调用你的 Google Sheet 同步函数
        // await syncToGoogleSheet(ocrData.words_result);
      } else {
        alert("识别失败，请检查票据是否清晰！");
        console.error(ocrData);
      }
    } catch (err) {
      alert("识别接口请求失败！");
      console.error(err);
    }
  };
});

// 展示结果到页面
function displayResult(data) {
  const container = document.getElementById('resultContainer');
  container.innerHTML = '';

  // 假设识别结果是 text 多行
  const lines = data.words_result.map(item => item.words);

  lines.forEach((line, index) => {
    const [title, content] = line.includes(':') ? line.split(':', 2) : [line, ''];
    
    const row = document.createElement('div');
    row.className = 'result-row';

    const titleEl = document.createElement('div');
    titleEl.className = 'result-title';
    titleEl.textContent = title.trim();

    const contentEl = document.createElement('div');
    contentEl.className = 'result-content';
    contentEl.textContent = content.trim();

    row.appendChild(titleEl);
    row.appendChild(contentEl);
    container.appendChild(row);
  });
}
