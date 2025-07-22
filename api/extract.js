// api/extract.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    const { imageBase64 } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "请识别图片中的发票信息，返回格式为：{ \"date\": \"YYYY-MM-DD\", \"amount\": 123.45 }。如无法识别请返回 null。"
        },
        {
          role: "user",
          content: [
            { type: "text", text: "请识别这张图片的发票信息：" },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }
      ]
    });

    const resultText = completion.choices[0].message.content;
    const json = JSON.parse(resultText);
    res.status(200).json(json);
  } catch (err) {
    console.error("❌ OpenAI OCR Error:", err);
    res.status(500).json({ message: "识别接口异常", error: err.toString() });
  }
}
