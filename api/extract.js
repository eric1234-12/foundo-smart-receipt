import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  const { imageBase64 } = req.body;
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
      model: "gpt-4-vision-preview",
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      max_tokens: 300
    });

    const json = visionRes.choices[0]?.message?.content;
    const parsed = JSON.parse(json);
    res.status(200).json(parsed);
  } catch (err) {
    console.error("🧠 ChatGPT 识别失败", err);
    res.status(500).json({ error: "识别失败" });
  }
}
