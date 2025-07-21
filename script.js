document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const resultBox = document.getElementById("resultBox");

  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("请先选择文件");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://foundo-smart-receipt.vercel.app/api/baidu-token", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("识别失败，请检查后端接口或网络问题");
      }

      const result = await response.json();
      displayDynamicResult(result);
    } catch (error) {
      console.error("识别出错：", error);
      resultBox.innerHTML = `<p style="color:red;">识别出错：${error.message}</p>`;
    }
  });

  function displayDynamicResult(data) {
    resultBox.innerHTML = "<h3>识别结果：</h3>";
    const list = document.createElement("ul");

    Object.entries(data).forEach(([key, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<strong>${key}：</strong> ${value}`;
      list.appendChild(item);
    });

    resultBox.appendChild(list);
  }
});
