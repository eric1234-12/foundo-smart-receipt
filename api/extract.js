export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ocrText } = req.body;

  if (!ocrText) {
    return res.status(400).json({ error: "Missing ocrText" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "你是一个票据字段识别助手，请从文本中提取以下字段：金额（Amount），日期（Date），发票号（Invoice No.）并返回标准 JSON 格式：{ amount: string, date: string, invoice: string }。如果缺失字段，用空字符串。"
          },
          {
            role: "user",
            content: ocrText
          }
        ],
        temperature: 0.2
      })
    });

    const result = await completionRes.json();

    const content = result.choices?.[0]?.message?.content || "";
    const extracted = JSON.parse(content);

    res.status(200).json({
      amount: extracted.amount || "",
      date: extracted.date || "",
      invoice: extracted.invoice || ""
    });
  } catch (err) {
    console.error("❌ GPT调用错误:", err);
    res.status(500).json({ error: "Failed to extract fields using ChatGPT" });
  }
}
