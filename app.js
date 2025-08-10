// Configurações do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxS0oMUypuQbsPVrkuKR1Xv9Q-5UVFP0",
  authDomain: "painelsolarmonitoramento-73d6e.firebaseapp.com",
  databaseURL: "https://painelsolarmonitoramento-73d6e-default-rtdb.firebaseio.com/",
  projectId: "painelsolarmonitoramento-73d6e",
  storageBucket: "painelsolarmonitoramento-73d6e.appspot.com",
  messagingSenderId: "xxxxxx",
  appId: "xxxxxx"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referência para o nó de temperaturas
const refTemperaturas = database.ref('painelSolar/temperaturas');

// Arrays para gráficos
const labels = []; // vai armazenar os horários
const dataBrita = [];
const dataVegetacao = [];

// Guarda todos os dados recebidos para filtrar depois
let allDados = [];

// Função para extrair só horário (HH:mm:ss) do timestamp
function getTimeOnly(timestamp) {
  return timestamp.split(" ")[1];
}

// Função para formatar data do timestamp para YYYY-MM-DD
function formatDateISO(timestamp) {
  return timestamp.split(" ")[0];
}

// Função para calcular limites Y (ignorando null)
function getYScaleLimits(dataArray) {
  const valoresValidos = dataArray.filter(v => v !== null);
  if (!valoresValidos.length) return {min: 0, max: 50};
  let min = Math.min(...valoresValidos);
  let max = Math.max(...valoresValidos);
  min = Math.floor(min - 2);
  max = Math.ceil(max + 2);
  if (min < 0) min = 0;
  return {min, max};
}

// Atualiza os gráficos com dados filtrados (apenas horário no eixo X)
function atualizarGraficos(dadosFiltrados) {
  labels.length = 0;
  dataBrita.length = 0;
  dataVegetacao.length = 0;

  dadosFiltrados.forEach(leitura => {
    labels.push(getTimeOnly(leitura.timestamp)); // só horário no eixo X
    dataBrita.push(leitura.temperaturaBrita === "erro" ? null : leitura.temperaturaBrita);
    dataVegetacao.push(leitura.temperaturaVegetacao === "erro" ? null : leitura.temperaturaVegetacao);
  });

  if (labels.length > 48) {
    labels.splice(0, labels.length - 48);
    dataBrita.splice(0, dataBrita.length - 48);
    dataVegetacao.splice(0, dataVegetacao.length - 48);
  }

  const yBrita = getYScaleLimits(dataBrita);
  chartBrita.options.scales.y.min = yBrita.min;
  chartBrita.options.scales.y.max = yBrita.max;

  const yVeg = getYScaleLimits(dataVegetacao);
  chartVegetacao.options.scales.y.min = yVeg.min;
  chartVegetacao.options.scales.y.max = yVeg.max;

  chartBrita.update();
  chartVegetacao.update();
}

// Configura gráficos (tooltip customizado e label X inclinado)
const ctxBrita = document.getElementById('chartBrita').getContext('2d');
const chartBrita = new Chart(ctxBrita, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: 'Temperatura (°C)',
      data: dataBrita,
      borderColor: '#00796b',
      backgroundColor: 'rgba(0, 121, 107, 0.2)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      spanGaps: false
    }]
  },
  options: {
    responsive: true,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const val = context.parsed.y;
            if (val === null) return 'Erro na leitura';
            return `Temperatura: ${val} °C`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Horário' },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        }
      },
      y: {
        title: { display: true, text: 'Temperatura (°C)' },
        min: 0,
        max: 50
      }
    }
  }
});

const ctxVegetacao = document.getElementById('chartVegetacao').getContext('2d');
const chartVegetacao = new Chart(ctxVegetacao, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: 'Temperatura (°C)',
      data: dataVegetacao,
      borderColor: '#388e3c',
      backgroundColor: 'rgba(56, 142, 60, 0.2)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      spanGaps: false
    }]
  },
  options: {
    responsive: true,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      tooltip: {
        callbacks: {
          label: context => {
            const val = context.parsed.y;
            if (val === null) return 'Erro na leitura';
            return `Temperatura: ${val} °C`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Horário' },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 12,
        }
      },
      y: {
        title: { display: true, text: 'Temperatura (°C)' },
        min: 0,
        max: 50
      }
    }
  }
});

// Variáveis filtro
const inputDate = document.getElementById('filterDate');
const btnClearFilter = document.getElementById('btnClearFilter');

// Ao carregar dados do Firebase
refTemperaturas.on('value', (snapshot) => {
  const dados = snapshot.val();
  if (!dados) return;

  const chaves = Object.keys(dados).sort();
  allDados = chaves.map(chave => dados[chave]);

  // Se filtro vazio, seta para data atual
  if (!inputDate.value) {
    const hoje = new Date();
    const isoHoje = hoje.toISOString().split('T')[0];
    inputDate.value = isoHoje;
  }

  filtrarEAtualizar();
});

// Função filtrar por data selecionada
function filtrarEAtualizar() {
  const dataSelecionada = inputDate.value;
  if (!dataSelecionada) {
    atualizarGraficos(allDados);
    return;
  }
  const dadosFiltrados = allDados.filter(leitura => formatDateISO(leitura.timestamp) === dataSelecionada);
  atualizarGraficos(dadosFiltrados);
}

// Eventos filtro
inputDate.addEventListener('change', filtrarEAtualizar);

btnClearFilter.addEventListener('click', () => {
  inputDate.value = "";
  atualizarGraficos(allDados);
});
