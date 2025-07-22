document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("请选择文件！");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function () {
    const imageBase64 = reader.result.split(",")[1];

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64 }),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonErr) {
        const text = await response.text();
        console.error("⚠️ 返回非 JSON 数据：", text);
        alert("识别接口请求失败（非JSON返回）！");
        return;
      }

      if (!result || !result.amount || !result.date) {
        alert("识别不到金额或日期，请上传清晰的票据！");
        return;
      }

      alert(`识别成功！金额：${result.amount}，日期：${result.date}`);
    } catch (err) {
      console.error("❌ 请求失败", err);
      alert("识别接口请求失败！");
    }
  };

  reader.readAsDataURL(file);
});
