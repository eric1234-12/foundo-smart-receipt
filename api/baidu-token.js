export default async function handler(req, res) {
  const response = await fetch("https://aip.baidubce.com/oauth/2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "你的API_KEY",
      client_secret: "你的SECRET_KEY",
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
