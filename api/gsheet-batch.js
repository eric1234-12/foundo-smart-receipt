// api/gsheet-batch.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Only POST allowed' });

  try {
    const {
      invoice,
      date,
      supplier,
      payment_method,
      total_amount,
      remarks,
      lines = [],
      imageBase64
    } = req.body || {};

    if (!invoice || !date || !supplier || !lines.length) {
      return res.status(400).json({ status: 'error', message: '缺少关键字段或没有行项目' });
    }

    // 1. 先上传图片（一次）
    let imageUrl = "";
    if (imageBase64) {
      const up = await fetch(process.env.GSCRIPT_ENTRYPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadOnly: true,
          base64: imageBase64,
          mimeType: "image/jpeg",
          filename: `${invoice}_${Date.now()}`
        })
      });
      const upJson = await up.json();
      if (upJson.imageUrl) imageUrl = upJson.imageUrl;
    }

    // 2. 拼 rows
    const rows = lines.map(l => ({
      invoice,
      date,
      supplier,
      product_name: l.product_name,
      quantity: l.quantity,
      line_total: l.line_total,
      total_amount,
      payment_method,
      remarks,
      imgurl: imageUrl
    }));

    // 3. 批量写表
    const rsp = await fetch(process.env.GSCRIPT_ENTRYPOINT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appendBatch: true,
        rows,
        timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
      })
    });

    const js = await rsp.json();
    if (js.status !== "ok") {
      return res.status(500).json({ status: 'error', message: js.message || '写入失败' });
    }
    return res.status(200).json({ status: 'ok' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ status: 'error', message: e.message || 'unknown' });
  }
}
