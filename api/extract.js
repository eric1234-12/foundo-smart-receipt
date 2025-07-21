// /api/extract.js
export default async function handler(req, res) {
  try {
    const { ocrText } = req.body;

    if (!ocrText) {
      return res.status(400).json({ error: "Missing ocrText" });
    }

    const systemPrompt = `
你是一个票据识别助手。从以下文本中提取以下字段：
1. 日期 (date)：票据或收据上的消费日期
2. 金额 (amount)：总金额或小计（subtotal/total）
3. 发票号 (invoice)：若存在则提取

只返回如下格式的 JSON，不需要解释：

{
  "date": "...",
  "amount": "...",
  "invoice": "..." // 如果没有就返回空字符串
}
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: ocrText }
        ],
        temperature: 0.2
      })
    });

    const result = await openaiRes.json();

    console.log("🧠 ChatGPT 原始响应：", JSON.stringify(result, null, 2));

    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      console.error("❌ ChatGPT 响应为空");
      return res.status(500).json({ error: "Empty response from OpenAI" });
    }

    try {
      const parsed = JSON.parse(content);
      const { date, amount, invoice } = parsed;
      return res.status(200).json({
        date: date || "",
        amount: amount || "",
        invoice: invoice || ""
      });
    } catch (err) {
      console.error("❌ JSON 解析失败：", content);
      return res.status(500).json({ error: "Failed to parse JSON", content });
    }

  } catch (error) {
    console.error("❌ 调用 OpenAI API 出错：", error);
    return res.status(500).json({ error: "Server Error", detail: error.message });
  }
}
