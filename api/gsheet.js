// /api/gsheet.js

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const gsResponse = await fetch(
      'https://script.google.com/macros/s/AKfycbykw8Fzv-UOL5oDVImThTeQHUEXgXk7A1uCg4BmGBUQdYyd5cL6GkBpjELRwYbGaXXd/exec',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    );

    const data = await gsResponse.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}
