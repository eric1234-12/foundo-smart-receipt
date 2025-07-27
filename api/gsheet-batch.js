// api/gsheet-batch.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDHtjRfXiUBklgge6k5m-Lp4Rwqx7M-d1eVIHFcI3rYmJNGzBXclhK5dQljqbHeHgRyw/exec"; 
    // ↑ 替换成你在 Apps Script 部署时生成的 Web App URL

    const payload = req.body;

    // 检查必填字段
    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ status: 'error', message: '无有效数据提交' });
    }

    console.log("📤 准备提交到 Google Sheet:", payload);

    // 发请求到 Google Apps Script
    const sheetRes = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const sheetData = await sheetRes.json().catch(() => null);
    if (!sheetData || sheetData.status !== 'ok') {
      console.error('❌ Google Sheet 写入失败:', sheetData);
      return res.status(500).json({ status: 'error', message: '写入 Google Sheet 失败' });
    }

    res.status(200).json({ status: 'ok', result: sheetData });
  } catch (err) {
    console.error('📄 数据上传失败:', err);
    res.status(500).json({ status: 'error', message: err.message || '未知错误' });
  }
}
