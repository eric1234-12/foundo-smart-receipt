// api/extract-lines.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, catalog = [] } = req.body || {};
  if (!imageBase64 || imageBase64.length < 100) {
    return res.status(400).json({ error: "无效的图片内容" });
  }

  const prompt = `
你是一个能读取图片中发票并输出结构化 JSON 的助手。
需求：
1）识别并返回：
   - supplier：发票抬头 / 票据上方公司名
   - invoice：发票号
   - date：日期（尽量 YYYY-MM-DD 或 DD/MM/YYYY）
   - payment_method：如 Cash/Card/Online
   - total_amount：总金额
2）识别行项目 lines（每个产品一行）：
   - product_name_raw：原始产品名
   - product_name_mapped：请用下面给你的“标准产品清单”找到最接近的一个填入（无则填空）
   - quantity：数量
   - line_total：该行小计金额
3）只以 JSON 返回，示例：
{
  "supplier": "ABC Sdn Bhd",
  "invoice": "INV-1234",
  "date": "2025-07-25",
  "payment_method": "Cash",
  "total_amount": 123.45,
  "lines": [
    { "product_name_raw": "croissant", "product_name_mapped": "FRENCH CROISSANT(Unit)", "quantity": 2, "line_total": 14.0 },
    { "product_name_raw": "milk bun", "product_name_mapped": "Milk Bun(Unit)", "quantity": 1, "line_total": 3.5 }
  ]
}

标准产品清单（你必须在 product_name_mapped 里只选择其中之一 / 或空）：
${catalog.join("\n")}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }
      ]
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    // console.log("🧠 raw:", raw);

    let match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleaned = "";
    if (match) cleaned = match[1];
    else {
      match = raw.match(/{[\s\S]*}/);
      cleaned = match ? match[0] : "";
    }
    if (!cleaned) {
      return res.status(500).json({ error: "未找到有效 JSON 输出" });
    }

    const parsed = JSON.parse(cleaned);

    // 兜底
    parsed.supplier ||= "";
    parsed.invoice ||= "";
    parsed.date ||= "";
    parsed.payment_method ||= "";
    parsed.total_amount ||= "";
    parsed.lines ||= [];

    return res.status(200).json(parsed);
  } catch (e) {
    console.error("extract-lines error:", e);
    return res.status(500).json({ error: e.message || "提取失败" });
  }
}
