// api/extract.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "仅支持 POST 请求" });
  }

  const { ocrText } = req.body;
  if (!ocrText) {
    return res.status(400).json({ error: "缺少 ocrText 字段" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ 缺少 OpenAI API 密钥！");
    return res.status(500).json({ error: "服务器缺少 OpenAI API 密钥" });
  }

  try {
    const systemPrompt = `
你是一个票据识别助手。从以下文本中提取以下字段：

1. 日期 (date)：票据或收据上的消费日期
2. 金额 (amount)：总金额或小计（subtotal/total）
3. 发票号 (invoice)：若存在则提取

只返回如下格式的 JSON，不需要解释：

{
  "date": "2024/07/01",
  "amount": "15.90",
  "invoice": "INV123456"
}

如果某字段不存在，请返回空字符串。
`;

    const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: ocrText }
        ]
      })
    });

    const result = await completionRes.json();

    console.log("🧠 ChatGPT 原始响应：", JSON.stringify(result, null, 2));

    const content = result.choices?.[0]?.message?.content || "";

    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch (err) {
      console.error("❌ JSON 解析失败：", content);
      return res.status(500).json({ error: "ChatGPT 返回内容不是合法 JSON", raw: content });
    }

    const { date = "", amount = "", invoice = "" } = extracted;

    console.log("✅ 提取结果：", { date, amount, invoice });

    res.status(200).json({ date, amount, invoice });

  } catch (error) {
    console.error("❌ 调用 OpenAI API 出错：", error);
    res.status(500).json({ error: "服务器内部错误", detail: error.message });
  }
}
