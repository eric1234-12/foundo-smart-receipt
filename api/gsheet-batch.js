export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDHtjRfXiUBklgge6k5m-Lp4Rwqx7M-d1eVIHFcI3rYmJNGzBXclhK5dQljqbHeHgRyw/exec";

    const input = req.body;

    // ✅ 图片上传任务
    if (input.uploadOnly && input.base64) {
      console.log("📸 开始上传图片到 Google Drive...");

      const uploadRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadOnly: true,
          filename: input.filename || `upload_${Date.now()}.jpg`,
          mimeType: input.mimeType || 'image/jpeg',
          base64: input.base64
        })
      });

      const uploadData = await uploadRes.json().catch(err => {
        console.error("❌ 上传返回非 JSON：", err);
        return null;
      });

      if (!uploadData || !uploadData.imageUrl) {
        return res.status(500).json({ status: 'error', message: '图片上传失败', result: uploadData });
      }

      console.log("✅ 图片上传成功:", uploadData.imageUrl);
      return res.status(200).json({ status: 'ok', imageUrl: uploadData.imageUrl });
    }

    // ✅ 数据写入 Google Sheet
    if (input.appendBatch && Array.isArray(input.rows) && input.rows.length > 0) {
      const payload = {
        appendBatch: true,
        timestamp: input.timestamp || new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
        rows: input.rows
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
      return res.status(200).json({ status: 'ok', count: sheetData.count || 0, result: sheetData });
    }

    console.warn("⚠️ 无效的请求结构：", input);
    return res.status(400).json({ status: 'error', message: '无效的请求结构' });

  } catch (err) {
    console.error('❌ 发生错误:', err);
    return res.status(500).json({ status: 'error', message: err.message || '未知错误' });
  }
}
