const BASE_URL = "https://open.er-api.com/v6/latest";

const dropdowns = document.querySelectorAll(".dropdown select");
const btn = document.querySelector("form button");
const fromCurr = document.querySelector(".from select");
const toCurr = document.querySelector(".to select");
const msg = document.querySelector(".msg");

/* DROPDOWN LOAD */

for (let select of dropdowns) {

for (let currCode in countryList) {

let newOption = document.createElement("option");

newOption.innerText = currCode;
newOption.value = currCode;

if (select.name === "from" && currCode === "USD") {
newOption.selected = "selected";
}

else if (select.name === "to" && currCode === "INR") {
newOption.selected = "selected";
}

select.append(newOption);

}

select.addEventListener("change", (evt) => {

updateFlag(evt.target);

localStorage.setItem("fromCurrency", fromCurr.value);
localStorage.setItem("toCurrency", toCurr.value);

});

}

/* EXCHANGE RATE */

const updateExchangeRate = async () => {

let amount = document.querySelector(".amount input");
let amtVal = amount.value;

if (amtVal === "" || amtVal < 1) {
amtVal = 1;
amount.value = "1";
}

const URL = `${BASE_URL}/${fromCurr.value}`;

let response = await fetch(URL);
let data = await response.json();

let rate = data.rates[toCurr.value];

let finalAmount = amtVal * rate;

msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount.toFixed(2)} ${toCurr.value}`;

msg.classList.add("animate");

setTimeout(() => {
msg.classList.remove("animate");
}, 300);

drawChart(rate);
drawHistoryChart();

};

/* FLAG UPDATE */

const updateFlag = (element) => {

let currCode = element.value;

let countryCode = countryList[currCode];

let newSrc = `https://flagsapi.com/${countryCode}/flat/64.png`;

let img = element.parentElement.querySelector("img");

img.src = newSrc;

};

btn.addEventListener("click", (evt) => {
evt.preventDefault();
updateExchangeRate();
});

/* SWAP BUTTON */

const swapBtn = document.querySelector(".fa-right-left");

swapBtn.addEventListener("click", () => {

let temp = fromCurr.value;
fromCurr.value = toCurr.value;
toCurr.value = temp;

updateFlag(fromCurr);
updateFlag(toCurr);

updateExchangeRate();

});

/* AUTO UPDATE */

setInterval(() => {
updateExchangeRate();
}, 10000);

/* AMOUNT INPUT */

const amountInput = document.querySelector(".amount input");

amountInput.addEventListener("input", updateExchangeRate);

/* DARK MODE */

const modeBtn = document.getElementById("mode");

modeBtn.addEventListener("click", () => {

document.body.classList.toggle("dark");

modeBtn.innerText =
document.body.classList.contains("dark")
? "☀️ Light Mode"
: "🌙 Dark Mode";

});

/* PAGE LOAD */

window.addEventListener("load", () => {

let savedFrom = localStorage.getItem("fromCurrency");
let savedTo = localStorage.getItem("toCurrency");

if (savedFrom) {
fromCurr.value = savedFrom;
updateFlag(fromCurr);
}

if (savedTo) {
toCurr.value = savedTo;
updateFlag(toCurr);
}

updateExchangeRate();
loadTopCurrencies();
drawCompareChart();
loadHeatmap();

});

/* CHART */

let chart;

const drawChart = (rate) => {

const ctx = document.getElementById("rateChart");
if(!ctx) return;

const data = [
rate * 0.95,
rate * 0.97,
rate * 1.02,
rate * 0.98,
rate * 1.01,
rate * 0.99,
rate
];

if (chart) chart.destroy();

chart = new Chart(ctx, {

type: "line",

data: {
labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Today"],
datasets: [{
data: data,
borderColor: "#ff6a00",
backgroundColor: "rgba(255,106,0,0.2)",
tension: 0.4
}]
},

options: {
responsive: true,
plugins: { legend: { display: false } }
}

});

};

/* SEARCH */

const searchInput = document.getElementById("searchCurrency");

searchInput.addEventListener("input", () => {

let filter = searchInput.value.toUpperCase();

dropdowns.forEach(select => {

let options = select.options;

for (let i = 0; i < options.length; i++) {

let txt = options[i].text;

options[i].style.display =
txt.indexOf(filter) > -1 ? "" : "none";

}

});

});

/* FAVORITES */

const favBtns = document.querySelectorAll(".fav");

favBtns.forEach(btn => {

btn.addEventListener("click", () => {

let curr = btn.dataset.curr;

fromCurr.value = curr;

updateFlag(fromCurr);

updateExchangeRate();

});

});

/* TOP CURRENCIES */

const loadTopCurrencies = async () => {

const URL = `${BASE_URL}/USD`;

let response = await fetch(URL);
let data = await response.json();

let rates = data.rates;

let sorted = Object.entries(rates)
.sort((a,b)=>b[1]-a[1])
.slice(0,10);

let tableBody = document.querySelector("#currencyTable tbody");

if(!tableBody) return;

tableBody.innerHTML="";

sorted.forEach(curr=>{

tableBody.innerHTML+=`
<tr>
<td>${curr[0]}</td>
<td>${curr[1].toFixed(2)}</td>
</tr>
`;

});

};

/* COMPARE CHART */

let compareChart;

const drawCompareChart = async () => {

const URL = `${BASE_URL}/USD`;

let response = await fetch(URL);
let data = await response.json();

let rates = data.rates;

let currencies = ["USD","INR","EUR"];

let values = currencies.map(c => rates[c] || 1);

const ctx = document.getElementById("compareChart");
if(!ctx) return;

if(compareChart) compareChart.destroy();

compareChart = new Chart(ctx,{
type:"bar",

data:{
labels:currencies,
datasets:[{
label:"Currency Comparison",
data:values
}]
},

options:{responsive:true}

});

};

/* DOWNLOAD PDF */

const downloadBtn = document.getElementById("downloadReport");

if(downloadBtn){

downloadBtn.addEventListener("click",()=>{

const { jsPDF } = window.jspdf;

let doc = new jsPDF();

let amount=document.querySelector(".amount input").value;

doc.text("Currency Exchange Report",20,20);
doc.text(`Amount: ${amount}`,20,40);
doc.text(`From: ${fromCurr.value}`,20,50);
doc.text(`To: ${toCurr.value}`,20,60);
doc.text(msg.innerText,20,80);

doc.save("exchange-report.pdf");

});

}

/* SERVICE WORKER */

if ("serviceWorker" in navigator) {
navigator.serviceWorker.register("service-worker.js");
}

/* HISTORY CHART */

let historyChart;

const drawHistoryChart = async () => {

let today = new Date();
let labels=[];
let values=[];

for(let i=6;i>=0;i--){

let d=new Date();
d.setDate(today.getDate()-i);

let date=d.toISOString().split("T")[0];

labels.push(date);

let res=await fetch(`${BASE_URL}/${fromCurr.value}`);
let data=await res.json();

values.push(data.rates[toCurr.value]);

}

const ctx=document.getElementById("historyChart");
if(!ctx) return;

if(historyChart) historyChart.destroy();

historyChart=new Chart(ctx,{
type:"line",

data:{
labels:labels,
datasets:[{
label:"7 Day Currency Trend",
data:values,
borderColor:"#00ffcc",
tension:0.4
}]
},

options:{responsive:true}

});

};

/* HEATMAP */

const loadHeatmap = async () => {

let res = await fetch(`${BASE_URL}/USD`);
let data = await res.json();

let rates = data.rates;

let currencies = ["USD","INR","EUR","GBP","JPY","AUD","CAD","CHF"];

let grid = document.getElementById("heatmapGrid");
if(!grid) return;

grid.innerHTML="";

currencies.forEach(curr=>{

let val=rates[curr]||1;

let box=document.createElement("div");

box.classList.add("heatBox");

if(val>1.2){
box.classList.add("strong");
}
else if(val>0.8){
box.classList.add("neutral");
}
else{
box.classList.add("weak");
}

box.innerHTML=`${curr}<br>${val.toFixed(2)}`;

grid.appendChild(box);

});

};