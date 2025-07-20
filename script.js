async function getAccessToken() {
  const res = await fetch("https://aip.baidubce.com/oauth/2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&client_id=Rn1ouMVSbEqJDNxU5vyqJmGU&secret_key=P9MXXYkTh2f3RIOjp5BMNAG1EQXUufaj"
  });
  const data = await res.json();
  return data.access_token;
}

async function startOCR() {
  const fileInput = document.getElementById("imageInput");
  if (!fileInput.files[0]) return alert("请先选择图片");

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result.split(",")[1];
    const token = await getAccessToken();
    const res = await fetch("https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=" + token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "image=" + encodeURIComponent(base64)
    });
    const data = await res.json();
    const words = data.words_result.map(w => w.words).join("\\n");
    parseFields(words);
  };
  reader.readAsDataURL(fileInput.files[0]);
}

function parseFields(text) {
  document.getElementById("formSection").style.display = "block";
  const storeMatch = text.match(/MR\\.\\s?.*/i);
  const amountMatch = text.match(/RM\\s?([\\d.]+)/i);
  const dateMatch = text.match(/\\d{2}\\/\\d{2}\\/\\d{4}/);
  document.getElementById("store").value = storeMatch ? storeMatch[0] : "";
  document.getElementById("amount").value = amountMatch ? amountMatch[1] : "";
  document.getElementById("datetime").value = dateMatch ? dateMatch[0] : new Date().toISOString().slice(0, 10);
}

function saveRecord() {
  const r = {
    store: document.getElementById("store").value,
    amount: parseFloat(document.getElementById("amount").value),
    datetime: document.getElementById("datetime").value,
    category: document.getElementById("category").value
  };
  const list = JSON.parse(localStorage.getItem("records") || "[]");
  list.push(r);
  localStorage.setItem("records", JSON.stringify(list));
  loadRecords();
}

function loadRecords() {
  const records = JSON.parse(localStorage.getItem("records") || "[]");
  const tbody = document.querySelector("#recordTable tbody");
  tbody.innerHTML = "";
  records.forEach(r => {
    tbody.innerHTML += `<tr><td>${r.store}</td><td>${r.amount.toFixed(2)}</td><td>${r.datetime}</td><td>${r.category}</td></tr>`;
  });
}

window.onload = loadRecords;
