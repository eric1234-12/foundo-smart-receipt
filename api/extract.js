import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64 } = req.body;

  if (!imageBase64 || imageBase64.length < 100) {
    return res.status(400).json({ error: "无效的图片内容，请上传清晰票据" });
  }

  const prompt = `
  你将获得一张票据的OCR文字内容，请从中提取以下字段：
  1. 发票号（invoice no / INV / invoice）：只提取编号
  2. 日期（格式如 dd/mm/yyyy 或 dd-mm-yyyy）
  3. 金额（最可能的总价，如 Total, Subtotal 等）
  4. 采购产品（products）：用逗号分隔
  输出格式如下：
  {
    "invoice": "...",
    "date": "...",
    "amount": "...",
    "products": "..."
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
              type: "image_url", // ⚠️ 这里改了
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const raw = visionRes.choices[0]?.message?.content?.trim();
    console.log("🧠 ChatGPT 原始响应:", raw);

    if (!raw) throw new Error("模型未返回结果");

    // 匹配 JSON
    let match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleaned = "";
    if (match) {
      cleaned = match[1];
    } else {
      match = raw.match(/{[\s\S]*}/);
      cleaned = match ? match[0] : "";
    }
    if (!cleaned) throw new Error("未找到有效 JSON 输出");

    const parsed = JSON.parse(cleaned);
    res.status(200).json(parsed);
  } catch (err) {
    console.error("🧠 ChatGPT Vision 识别失败", err);
    res.status(500).json({ error: "识别失败，请上传清晰票据", details: err.message });
  }
}
