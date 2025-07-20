document.getElementById("uploadBtn").addEventListener("click", async function () {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("请选择图片文件");
    return;
  }

  try {
    // 获取百度 Access Token（通过自己服务器中转，避免 CORS）
    const tokenRes = await fetch("/api/baidu-token");
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 将图片转为 base64
    const reader = new FileReader();
    reader.onload = async function () {
      const base64Img = reader.result.split(",")[1];

      // 调用百度 OCR 接口
      const ocrRes = await fetch(
        `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: `image=${encodeURIComponent(base64Img)}`
        }
      );

      const ocrData = await ocrRes.json();
      const text = ocrData.words_result.map(item => item.words).join("\n");
      console.log("OCR识别结果：", text);

      // 简单提取信息
      const storeMatch = text.match(/(便利店|超市|7-11|FamilyMart|KK|99 Speedmart|myNEWS)/i);
      const amountMatch = text.match(/(?:RM|MYR)?\s?(\d+\.\d{2})/);
      const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);

      const store = storeMatch ? storeMatch[0] : "未知";
      const amount = amountMatch ? amountMatch[1] : "未识别";
      const date = dateMatch ? dateMatch[0] : "未识别";

      // 添加到历史记录表格
      const table = document.getElementById("historyTable");
      const row = table.insertRow(-1);
      row.insertCell(0).innerText = store;
      row.insertCell(1).innerText = amount;
      row.insertCell(2).innerText = date;
      row.insertCell(3).innerText = "其他";
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("识别失败", error);
    alert("识别失败，请检查控制台获取详细信息");
  }
});
