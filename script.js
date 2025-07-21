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
      const ocrRes = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/vat_invoice?access_token=${accessToken}`, {
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
function displayResult(wordsResult) {
  const resultDiv = document.getElementById("resultBox");
  resultDiv.innerHTML = "<h3>识别结果：</h3>";
  const list = document.createElement("ul");
  for (const key in wordsResult) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${key}:</strong> ${wordsResult[key].words}`;
    list.appendChild(li);
  }
  resultDiv.appendChild(list);
}
