import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64 } = req.body;

  if (!imageBase64 || imageBase64.length < 100) {
    return res.status(400).json({ error: "无效的图片内容，请上传清晰票据" });
  }

  const prompt = `
你将获得一张票据的OCR文字内容，请你从中提取以下字段：
1. 发票号（invoice no / INV / invoice）：只提取编号
2. 日期（格式如 dd/mm/yyyy 或 dd-mm-yyyy）
3. 金额（最可能的总价，如 Total, Subtotal 等）
输出格式如下：
{
  "invoice": "...",
  "date": "...",
  "amount": "..."
}
`;

  try {
    const visionRes = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const response = visionRes.choices[0]?.message?.content?.trim();
    if (!response) {
      throw new Error("模型未返回结果");
    }

    // 去除markdown标记后解析
    const cleaned = response.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("🧠 ChatGPT Vision 识别失败", err);
    res.status(500).json({ error: "识别失败，请上传清晰票据", details: err.message });
  }
}
