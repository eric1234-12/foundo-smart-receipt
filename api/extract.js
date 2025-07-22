// api/extract.js
export default async function handler(req, res) {
  const { imageBase64 } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  try {
    const prompt = `
You are a receipt parser. Extract the following fields from the receipt text:
1. Date (format: DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD)
2. Total amount
3. Invoice number (if available)

Return the result as JSON:
{
  "date": "...",
  "amount": "...",
  "invoice": "..."
}

The receipt base64 image is below:
<image>
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const data = await openaiRes.json();

    const text = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(text);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("❌ 提取失败:", err);
    res.status(500).json({ error: "ChatGPT 提取失败" });
  }
}
