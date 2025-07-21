document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("请先选择图片文件！");
    return;
  }

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

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64Image = reader.result.split(",")[1];
    try {
      const ocrRes = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general?access_token=${accessToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `image=${encodeURIComponent(base64Image)}`
      });

      const ocrData = await ocrRes.json();
      if (ocrData.words_result) {
        await syncToGoogleSheet(ocrData.words_result, base64Image);
        const dateText = extractDate(ocrData.words_result) || "未知日期";
        document.getElementById("resultContainer").innerHTML = `✅ 成功 - ${dateText}`;
      } else {
        alert("识别失败，请检查票据是否清晰！");
      }
    } catch (err) {
      alert("识别失败！");
      console.error(err);
    }
  };
});

function extractDate(lines) {
  for (const item of lines) {
    const match = item.words.match(/\d{2}\/\d{2}\/\d{2,4}/);
    if (match) return match[0];
  }
  return "";
}

async function syncToGoogleSheet(ocrLines, base64Image) {
  const lines = ocrLines.map(item => item.words);
  let amount = "", date = "", raw = lines.join("\n");

  for (const line of lines) {
    if (!amount && line.match(/total|subtotal|rm|myr/i)) {
      const match = line.match(/\d+[.,]?\d{0,2}/);
      if (match) amount = match[0];
    }
    if (!date && line.match(/\d{2}\/\d{2}\/\d{2,4}/)) {
      date = line.match(/\d{2}\/\d{2}\/\d{2,4}/)[0];
    }
  }

  const note = prompt("请输入备注：") || "";
  const category = prompt("请输入类别（supermarkt, HD, HD Fruit, HD Milk, HD MILK2, OTHERS）：") || "OTHERS";

  await fetch("/api/gsheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date,
      amount,
      category,
      note,
      raw,
      imageBase64
    })
  });
}
