export default async function handler(req, res) {
  const response = await fetch("https://aip.baidubce.com/oauth/2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "Rn1ouMVSbEqJDNxU5vyqJmGU",
      client_secret: "P9MXXYkTh2f3RIOjp5BMNAG1EQXUufaj",
    }),
  });

  const data = await response.json();
  res.status(200).json(data);
}
