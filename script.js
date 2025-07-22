document.getElementById('uploadBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert("请选择一张图片！");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const imageBase64 = reader.result.split(',')[1];

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      console.log("成功：", data);
      alert("识别成功！");
    } catch (err) {
      console.error("请求失败", err);
      alert("识别接口请求失败！");
    }
  };

  reader.readAsDataURL(file);
});
