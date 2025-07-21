let pendingUploadData = null;

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) {
    alert("请先选择图片文件！");
    return;
  }

  // 获取百度 access_token
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
      if (!ocrData.words_result) {
        alert("识别失败，请检查票据是否清晰！");
        return;
      }

      const lines = ocrData.words_result.map(item => item.words);
      let amount = "", date = "";

      for (const line of lines) {
        if (!amount && line.match(/total|subtotal|rm|myr/i)) {
          const match = line.match(/\d+[.,]?\d{0,2}/);
          if (match) amount = match[0];
        }
        if (!date && line.match(/\d{2}\/\d{2}\/\d{2,4}/)) {
          date = line.match(/\d{2}\/\d{2}\/\d{2,4}/)[0];
        }
      }

      if (!amount || !date) {
        alert("识别不到金额或日期，请上传清晰的票据！");
        return;
      }

      // 储存待上传数据
     pendingUploadData = {
  amount,
  date,
  imageBase64: base64Image
};

      // 显示自定义弹窗
      document.getElementById("modalText").textContent = `系统识别如下内容:\n📅 日期: ${date}\n💰 金额: ${amount}`;
      document.getElementById("confirmModal").style.display = "block";

    } catch (err) {
      alert("识别接口请求失败！");
      console.error(err);
    }
  };
});

// 点击确认上传
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
