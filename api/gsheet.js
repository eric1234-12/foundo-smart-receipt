import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const {
    invoice,
    date,
    note,
    amount,
    category1,
    category2,
    imageBase64
  } = req.body;

  const timestamp = new Date().toISOString();

  try {
    // 🧠 上传图片到 Google Drive
    const imageBuffer = Buffer.from(imageBase64, "base64");

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/spreadsheets"]
    });

    const authClient = await auth.getClient();
    const drive = google.drive({ version: "v3", auth: authClient });

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const fileMetadata = {
      name: `${invoice || "receipt"}_${Date.now()}.jpg`,
      parents: [folderId]
    };

    const media = {
      mimeType: "image/jpeg",
      body: Buffer.from(imageBuffer)
    };

    const uploaded = await drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: "image/jpeg",
        body: media.body
      },
      fields: "id"
    });

    const fileId = uploaded.data.id;
    const imageUrl = `https://drive.google.com/uc?id=${fileId}`;

    // 🧠 写入 Google Sheet
    const sheets = google.sheets({ version: "v4", auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const isRR = category1 === "RR";

    const row = isRR
      ? [invoice || "", date || "", note || "", "", amount || "", timestamp, imageUrl]
      : [invoice || "", date || "", note || "", amount || "", "", timestamp, imageUrl];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row]
      }
    });

    res.status(200).json({ success: true, imageUrl });
  } catch (err) {
    console.error("GSheet 上传失败:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
