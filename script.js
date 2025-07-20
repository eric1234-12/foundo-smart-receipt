async function getAccessToken() {
  const res = await fetch("https://aip.baidubce.com/oauth/2.0/token", {
    method: "POST",
    headers: {"Content-Type":"application/x-www-form-urlencoded"},
    body: "grant_type=client_credentials&client_id=Rn1ouMVSbEqJDNxU5vyqJmGU&client_secret=P9MXXYkTh2f3RIOjp5BMNAG1EQXUufaj"
  });
  const data = await res.json();
  return data.access_token;
}
function parseFields(text, words) {
  document.getElementById("formSection").style.display = "block";
  const store = (words.find(w => /[A-Za-z].*/.test(w)) || "");
  const amount = (text.match(/RM\\s*([0-9.]+)/i)||[])[1] || "";
  const date = (text.match(/\\d{2}\\/\\d{2}\\/\\d{4}/)||[])[0] || "";
  document.getElementById("store").value = store;
  document.getElementById("amount").value = amount;
  document.getElementById("datetime").value = date;
}
function saveRecord() {
  const r = {
    store: document.getElementById("store").value,
    amount: +document.getElementById("amount").value,
    datetime: document.getElementById("datetime").value,
    category: document.getElementById("category").value
  };
  const arr = JSON.parse(localStorage.getItem("records")||"[]");
  arr.push(r);
  localStorage.setItem("records", JSON.stringify(arr));
  loadRecords();
}
function loadRecords() {
  const arr = JSON.parse(localStorage.getItem("records")||"[]");
  const tbody = document.querySelector("#recordTable tbody");
  tbody.innerHTML = "";
  arr.forEach(r => {
    const tr = `<tr><td>${r.store}</td><td>${r.amount.toFixed(2)}</td><td>${r.datetime}</td><td>${r.category}</td></tr>`;
    tbody.insertAdjacentHTML("beforeend",tr);
  });
}
async function startOCR() {
  const fi = document.getElementById("imageInput");
  if(!fi.files[0])return alert("请先选图片");
  const reader=new FileReader();
  reader.onload=async()=> {
    const b=reader.result.split(",")[1];
    const token=await getAccessToken();
    const res=await fetch("https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token="+token,{
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"image="+encodeURIComponent(b)
    });
    const d=await res.json();
    const txt=d.words_result.map(x=>x.words).join("\\n");
    parseFields(txt, d.words_result.map(x=>x.words));
  };
  reader.readAsDataURL(fi.files[0]);
}
window.onload=loadRecords;
