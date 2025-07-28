export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDHtjRfXiUBklgge6k5m-Lp4Rwqx7M-d1eVIHFcI3rYmJNGzBXclhK5dQljqbHeHgRyw/exec";

    const input = req.body;

    if (!Array.isArray(input) || input.length === 0) {
      console.error("❌ 请求体不是有效数组：", input);
      return res.status(400).json({ status: 'error', message: '无有效数据提交' });
    }

    // 判断是否存在图片上传任务
    const uploadOnlyTask = input.find(item => item.uploadOnly && item.base64);

    if (uploadOnlyTask) {
      console.log("📸 开始上传图片到 Google Drive...");

      const uploadRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadOnly: true,
          filename: uploadOnlyTask.filename || 'upload.jpg',
          mimeType: uploadOnlyTask.mimeType || 'image/jpeg',
          base64: uploadOnlyTask.base64
        })
      });

      const uploadData = await uploadRes.json().catch(err => {
        console.error("❌ 上传返回非 JSON：", err);
        return null;
      });

      if (!uploadData || !uploadData.url) {
        return res.status(500).json({ status: 'error', message: '图片上传失败', result: uploadData });
      }

      console.log("✅ 图片上传成功:", uploadData.url);
      return res.status(200).json({ status: 'ok', url: uploadData.url });
    }

    // 如果是写入 Google Sheet
    const payload = {
      appendBatch: true,
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
      rows: input
    };

    console.log("📤 准备提交到 Google Sheet:", JSON.stringify(payload, null, 2));

    const sheetRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const sheetData = await sheetRes.json().catch(err => {
      console.error("❌ Google Script 返回非 JSON：", err);
      return null;
    });

    if (!sheetData || sheetData.status !== 'ok') {
      console.error('❌ Google Sheet 写入失败:', sheetData);
      return res.status(500).json({ status: 'error', message: '写入 Google Sheet 失败', result: sheetData });
    }

    console.log("✅ 表格写入成功:", sheetData);
    return res.status(200).json({ status: 'ok', result: sheetData });

  } catch (err) {
    console.error('❌ 发生错误:', err);
    return res.status(500).json({ status: 'error', message: err.message || '未知错误' });
  }
}
