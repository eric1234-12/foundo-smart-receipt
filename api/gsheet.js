export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { invoice, date, note, amount, brand, imageBase64 } = req.body;

    // 上传图片到 Google Drive
    let imageUrl = '';
    if (imageBase64) {
      const driveUploadRes = await fetch(
        'https://script.google.com/macros/s/AKfycbxCZn8KKNzv3C6dTTxuyOo_FV4Jmk3DAi8NI189sRXJ3Iq9fuFSaCzRuDGDHgevVaf5/exec',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uploadOnly: true, imageBase64 })
        }
      );
      const driveData = await driveUploadRes.json();
      imageUrl = driveData.imageUrl || '';
    }

    // 构造表格数据
    const row = {
      invoice: invoice || '',
      date: date || '',
      note: note || '',
      rrAmount: brand === 'RR' ? amount : '',
      aunteaAmount: brand === 'auntea jenny' ? amount : '',
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
      imageUrl
    };

    // 上传表格数据
    const sheetRes = await fetch(
      'https://script.google.com/macros/s/AKfycbxCZn8KKNzv3C6dTTxuyOo_FV4Jmk3DAi8NI189sRXJ3Iq9fuFSaCzRuDGDHgevVaf5/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appendOnly: true, row })
      }
    );

    const data = await sheetRes.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
