export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Only POST allowed' });
  }

  const {
    invoice, date, note, amount, product, paid, payer,
    brand, category, base64, mimeType
  } = req.body;

  if (!invoice || !date || !amount) {
    return res.status(400).json({ status: 'error', message: '缺少必要字段' });
  }

  let imageUrl = '';
  if (base64 && mimeType) {
    const uploadRes = await fetch('https://script.google.com/macros/s/AKfycbxebo8fn4PVzl1j-E933KfyOMXCKWLFf1FdZ4iWTwGJC4Yeh5-TapEreZouobT_Y2fn/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadOnly: true, base64, mimeType, filename: `${invoice}_${Date.now()}` })
    });
    const data = await uploadRes.json();
    if (!data.imageUrl) {
      return res.status(500).json({ status: 'error', message: '图片上传失败' });
    }
    imageUrl = data.imageUrl;
  }
  
  const sheetRes = await fetch('https://script.google.com/macros/s/AKfycbxebo8fn4PVzl1j-E933KfyOMXCKWLFf1FdZ4iWTwGJC4Yeh5-TapEreZouobT_Y2fn/exec',{
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appendOnly: true,
      invoice, date, amount, note, category, paid, payer,product, brand, 
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
      imageUrl
    })
  });

  const result = await sheetRes.json();
  if (result.status !== 'ok') {
    return res.status(500).json({ status: 'error', message: '写入失败' });
  }

  return res.status(200).json({ status: 'ok' });
}
