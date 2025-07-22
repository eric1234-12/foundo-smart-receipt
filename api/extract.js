import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      console.error("❌ 缺少图片数据");
      return res.status(400).json({ error: "No image data provided" });
    }

    // 转为base64图像提示内容
    const prompt = `
你是一个票据识别助手。我会提供票据OCR图像内容，请你提取以下字段，并返回JSON格式结果：
- 日期（字段名："date"，格式如：2025-07-21）
- 金额（字段名："amount"，单位为数字，例如 35.90）
- 发票编号（如果有，字段名："invoice"）
- 商家名称（字段名："vendor"，如果有）

请只返回以下 JSON：
{
  "date": "...",
  "amount": "...",
  "invoice": "...",
  "vendor": "..."
}

以下是票据图像，请识别：
<image>
`;

    const response = await openai.createChatCompletion({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const resultText = response.data.choices[0]?.message?.content || "";
    console.log("🧠 ChatGPT 原始响应：", resultText);

    // 尝试解析JSON
    let extracted;
    try {
      extracted = JSON.parse(resultText);
    } catch (jsonErr) {
      console.error("⚠️ ChatGPT 返回的内容无法解析为 JSON：", resultText);
      return res.status(500).json({ error: "Invalid JSON response from ChatGPT" });
    }

    const { date, amount, invoice, vendor } = extracted || {};
    console.log("✅ 提取成功：", { date, amount, invoice, vendor });

    res.status(200).json({ date, amount, invoice, vendor });

  } catch (err) {
    console.error("❌ 接口错误：", err.message);
    res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
