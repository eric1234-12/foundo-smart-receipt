export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { invoice, date, note, amount, brand, base64, mimeType } = req.body;

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
      imageUrl = uploadData.imageUrl || '';
    }

    const row = {
      invoice: invoice || '',
      date: date || '',
      note: note || '',
      rrAmount: brand === 'RR' ? amount : '',
      aunteaAmount: brand === 'auntea jenny' ? amount : '',
      timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" }),
      imageUrl
    };

    const sheetRes = await fetch(
      'https://script.google.com/macros/s/AKfycbxebo8fn4PVzl1j-E933KfyOMXCKWLFf1FdZ4iWTwGJC4Yeh5-TapEreZouobT_Y2fn/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appendOnly: true, row })
      }
    );

    const sheetData = await sheetRes.json();
    res.status(200).json(sheetData);

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
