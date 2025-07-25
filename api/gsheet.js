export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const { invoice, date, note, amount, product, paid, payer, brand, category, base64, mimeType } = req.body;

    if (!invoice || !date || !amount) {
      return res.status(400).json({ status: 'error', message: '缺少必要字段：invoice, date, amount' });
    }

    let imageUrl = '';
    if (base64 && mimeType) {
      const uploadRes = await fetch(
        'https://script.google.com/macros/s/AKfycbxebo8fn4PVzl1j-E933KfyOMXCKWLFf1FdZ4iWTwGJC4Yeh5-TapEreZouobT_Y2fn/exec',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uploadOnly: true,
            base64,
            mimeType,
            filename: `${invoice || 'receipt'}_${Date.now()}`
          })
        }
      );

      const uploadData = await uploadRes.json();
      if (!uploadData.imageUrl) {
        return res.status(500).json({ status: 'error', message: '图片上传失败' });
      }
      imageUrl = uploadData.imageUrl;
    }

    // 写入 Google Sheet
    const sheetRes = await fetch(
      'https://script.google.com/macros/s/AKfycbxebo8fn4PVzl1j-E933KfyOMXCKWLFf1FdZ4iWTwGJC4Yeh5-TapEreZouobT_Y2fn/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appendOnly: true,
          invoice,
          date,
          amount,
          product,
          paid,
          payer,
          note: note || '',
          brand,
          category,
          timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
          imageUrl
        })
      }
    );

    const sheetData = await sheetRes.json();
    if (sheetData.status !== 'ok') {
      return res.status(500).json({ status: 'error', message: '写入表格失败' });
    }

    res.status(200).json(sheetData);

  } catch (err) {
    console.error('📄 数据上传失败:', err);
    res.status(500).json({ status: 'error', message: err.message || '未知错误' });
  }
}
