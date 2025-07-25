export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  try {
    const {
      invoice,
      date,
      note,
      amount,
      brand,
      base64,
      mimeType,
      product,  // 采购产品
      paid,     // 是否已付款
      payer     // 垫付人员
    } = req.body;

    // 校验必要字段
    if (!invoice || !date || !amount || !brand) {
      return res.status(400).json({
        status: 'error',
        message: '缺少必要字段：invoice, date, amount, brand'
      });
    }

    let imageUrl = '';

    // ✅ 上传文件到 Google Drive
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
        return res.status(500).json({
          status: 'error',
          message: '图片上传失败'
        });
      }
      imageUrl = uploadData.imageUrl;
    }

    // ✅ 写入 Google Sheet
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
          product: product || '',
          paid: paid || 'yes',
          payer: payer || '',
          note: note || '',
          brand,
          base64,
          mimeType,
          filename: `${invoice || 'receipt'}_${Date.now()}`,
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
