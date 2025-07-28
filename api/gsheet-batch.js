export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxDHtjRfXiUBklgge6k5m-Lp4Rwqx7M-d1eVIHFcI3rYmJNGzBXclhK5dQljqbHeHgRyw/exec";
    // ↑ 替换为你的 Google Apps Script 部署链接

    const input = req.body;

    // 检查是否为数组，且长度不为 0
    if (!Array.isArray(input) || input.length === 0) {
      console.error("❌ 请求体不是有效数组：", input);
      return res.status(400).json({ status: 'error', message: '无有效数据提交' });
    }

    // 封装成 Apps Script 预期的格式
    const payload = {
      appendBatch: true,
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
      rows: input
    };

    console.log("📤 准备提交到 Google Apps Script:", JSON.stringify(payload, null, 2));

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

    console.log("✅ 写入成功:", sheetData);
    return res.status(200).json({ status: 'ok', result: sheetData });

  } catch (err) {
    console.error('❌ 发生错误:', err);
    return res.status(500).json({ status: 'error', message: err.message || '未知错误' });
  }
}
