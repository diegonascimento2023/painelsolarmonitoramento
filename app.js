// =================== CONFIGURAÇÕES FIREBASE ===================
const firebaseConfig = {
  apiKey: "AIzaSyDxS0oMUypuQbsPVrkuKR1Xv9zQ-5UVFP0",
  authDomain: "painelsolarmonitoramento-73d6e.firebaseapp.com",
  databaseURL: "https://painelsolarmonitoramento-73d6e-default-rtdb.firebaseio.com/",
  projectId: "painelsolarmonitoramento-73d6e",
  storageBucket: "painelsolarmonitoramento-73d6e.appspot.com",
  messagingSenderId: "xxxxxx",
  appId: "xxxxxx"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// =================== REFERÊNCIA AOS DADOS ===================
const refDados = database.ref("painelSolar/dados");

// =================== ESTRUTURAS DE DADOS ===================
const labels = [];
const dataBrita = { temp: [], v: [], i: [], p: [] };
const dataVegetacao = { temp: [], v: [], i: [], p: [] };
let allDados = [];

// =================== ELEMENTOS ===================
const inputDate = document.getElementById("filterDate");
const btnClearFilter = document.getElementById("btnClearFilter");

// =================== SPINNER ===================
const spinner = document.createElement("div");
spinner.id = "spinner";
spinner.style = `
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center;
  z-index: 9999; font-size: 2rem; color: #00695c; font-weight: bold;
`;
spinner.innerHTML = "Carregando...";
document.body.appendChild(spinner);
spinner.style.display = "none";

// =================== MENSAGEM SEM DADOS ===================
const msgSemDados = document.createElement("div");
msgSemDados.id = "msgSemDados";
msgSemDados.style = `
  text-align: center; color: #c62828; font-size: 1.2rem; margin: 20px 0; display: none;
`;
msgSemDados.innerText = "Nenhum dado encontrado para esta data.";
document.querySelector(".container").prepend(msgSemDados);

// =================== BOTÃO EXPORTAR CSV ===================
const btnExportCSV = document.createElement("button");
btnExportCSV.id = "btnExportCSV";
btnExportCSV.innerText = "Exportar CSV";
btnExportCSV.style = `
  margin-left: 12px; padding: 7px 16px; background-color: #388e3c; border: none;
  border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: background-color 0.3s ease;
`;
btnExportCSV.onmouseover = () => (btnExportCSV.style.backgroundColor = "#00695c");
btnExportCSV.onmouseout = () => (btnExportCSV.style.backgroundColor = "#388e3c");
btnClearFilter.after(btnExportCSV);

// =================== FUNÇÕES AUXILIARES ===================
function getTimeOnly(timestamp) {
  return timestamp.split(" ")[1];
}

function formatDateISO(timestamp) {
  return timestamp.split(" ")[0];
}

// =================== ATUALIZAÇÃO DE GRÁFICOS ===================
function atualizarGraficos(dadosFiltrados) {
  labels.length = 0;
  for (let k in dataBrita) dataBrita[k].length = 0;
  for (let k in dataVegetacao) dataVegetacao[k].length = 0;

  dadosFiltrados.forEach((d) => {
    labels.push(getTimeOnly(d.timestamp));
    dataBrita.temp.push(d.painelBrita.temperatura ?? null);
    dataBrita.v.push(d.painelBrita.tensao ?? null);
    dataBrita.i.push(d.painelBrita.corrente ?? null);
    dataBrita.p.push(d.painelBrita.potencia ?? null);

    dataVegetacao.temp.push(d.painelVegetacao.temperatura ?? null);
    dataVegetacao.v.push(d.painelVegetacao.tensao ?? null);
    dataVegetacao.i.push(d.painelVegetacao.corrente ?? null);
    dataVegetacao.p.push(d.painelVegetacao.potencia ?? null);
  });

  chartBrita.update();
  chartVegetacao.update();

  msgSemDados.style.display = dadosFiltrados.length === 0 ? "block" : "none";
}

// =================== CONFIGURAÇÃO DAS CORES ===================
const colors = {
  brita: {
    temperatura: "#FF7043", // Laranja suave
    tensao: "#42A5F5", // Azul
    corrente: "#AB47BC", // Roxo
    potencia: "#66BB6A", // Verde
  },
  vegetacao: {
    temperatura: "#FF7043",
    tensao: "#29B6F6",
    corrente: "#8E24AA",
    potencia: "#43A047",
  },
};

// =================== GRÁFICO — PAINEL BRITA ===================
const ctxBrita = document.getElementById("chartBrita").getContext("2d");
const chartBrita = new Chart(ctxBrita, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: dataBrita.temp,
        borderColor: colors.brita.temperatura,
        backgroundColor: "rgba(255, 112, 67, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
      {
        label: "Tensão (V)",
        data: dataBrita.v,
        borderColor: colors.brita.tensao,
        backgroundColor: "rgba(66, 165, 245, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
      {
        label: "Corrente (A)",
        data: dataBrita.i,
        borderColor: colors.brita.corrente,
        backgroundColor: "rgba(171, 71, 188, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
      {
        label: "Potência (W)",
        data: dataBrita.p,
        borderColor: colors.brita.potencia,
        backgroundColor: "rgba(102, 187, 106, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, boxWidth: 10 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? "erro"}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Horário" },
        ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 12 },
      },
      y: { title: { display: true, text: "Valores" } },
    },
  },
});

// =================== GRÁFICO — PAINEL VEGETAÇÃO ===================
const ctxVegetacao = document.getElementById("chartVegetacao").getContext("2d");
const chartVegetacao = new Chart(ctxVegetacao, {
  type: "line",
  data: {
    labels: labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: dataVegetacao.temp,
        borderColor: colors.vegetacao.temperatura,
        backgroundColor: "rgba(255, 112, 67, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
      {
        label: "Tensão (V)",
        data: dataVegetacao.v,
        borderColor: colors.vegetacao.tensao,
        backgroundColor: "rgba(41, 182, 246, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
      {
        label: "Corrente (A)",
        data: dataVegetacao.i,
        borderColor: colors.vegetacao.corrente,
        backgroundColor: "rgba(142, 36, 170, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
      {
        label: "Potência (W)",
        data: dataVegetacao.p,
        borderColor: colors.vegetacao.potencia,
        backgroundColor: "rgba(67, 160, 71, 0.15)",
        tension: 0.3,
        pointRadius: 3,
        fill: true,
      },
    ],
  },
  options: {
    responsive: true,
    interaction: { mode: "nearest", intersect: false },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true, boxWidth: 10 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y ?? "erro"}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Horário" },
        ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 12 },
      },
      y: { title: { display: true, text: "Valores" } },
    },
  },
});

// =================== LEITURA DO FIREBASE ===================
refDados.on("value", (snapshot) => {
  spinner.style.display = "flex";
  setTimeout(() => {
    const dados = snapshot.val();
    spinner.style.display = "none";
    if (!dados) {
      allDados = [];
      atualizarGraficos([]);
      return;
    }

    const chaves = Object.keys(dados).sort();
    allDados = chaves.map((key) => dados[key]);

    if (!inputDate.value) {
      const hoje = new Date();
      inputDate.value = hoje.toISOString().split("T")[0];
    }

    filtrarEAtualizar();
  }, 400);
});

// =================== FILTRAGEM ===================
function filtrarEAtualizar() {
  const dataSel = inputDate.value;
  if (!dataSel) return atualizarGraficos(allDados);
  const filtrados = allDados.filter((d) => formatDateISO(d.timestamp) === dataSel);
  atualizarGraficos(filtrados);
}

inputDate.addEventListener("change", filtrarEAtualizar);
btnClearFilter.addEventListener("click", () => {
  inputDate.value = "";
  atualizarGraficos(allDados);
});

// =================== EXPORTAÇÃO CSV ===================
btnExportCSV.addEventListener("click", () => {
  const dataSel = inputDate.value;
  const filtrados = dataSel ? allDados.filter((d) => formatDateISO(d.timestamp) === dataSel) : allDados;
  if (!filtrados.length) return alert("Nenhum dado para exportar!");

  let csv = "timestamp;tensao_brita;corrente_brita;potencia_brita;temperatura_brita;tensao_vegetacao;corrente_vegetacao;potencia_vegetacao;temperatura_vegetacao\n";
  filtrados.forEach((d) => {
    csv += `${d.timestamp};${d.painelBrita.tensao};${d.painelBrita.corrente};${d.painelBrita.potencia};${d.painelBrita.temperatura};${d.painelVegetacao.tensao};${d.painelVegetacao.corrente};${d.painelVegetacao.potencia};${d.painelVegetacao.temperatura}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dados_${dataSel || "todos"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// =================== MODO ESCURO ===================
const btnDarkMode = document.getElementById("btnDarkMode");
btnDarkMode.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  btnDarkMode.innerHTML = document.body.classList.contains("dark-mode")
    ? "☀️ Alternar modo claro"
    : "🌙 Alternar modo escuro";
});
