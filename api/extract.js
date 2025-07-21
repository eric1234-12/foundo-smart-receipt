// /api/extract.js
export default async function handler(req, res) {
  const { ocrText } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!ocrText) return res.status(400).json({ error: "Missing OCR text" });

  const prompt = `
你是一个收据数据提取助手，请从以下文字中提取以下字段：
- 日期（date）
- 总金额（amount）
- 发票号（invoice）

请输出 JSON 格式：
{ "date": "...", "amount": "...", "invoice": "..." }

收据内容如下：
"""${ocrText}"""
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed = {};
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: "解析 GPT 返回失败", raw: content });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("OpenAI API error:", err);
    return res.status(500).json({ error: "调用 OpenAI 失败" });
  }
}
