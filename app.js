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

// Adiciona spinner de carregamento
const spinner = document.createElement('div');
spinner.id = 'spinner';
spinner.style = `
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center;
  z-index: 9999; font-size: 2rem; color: #00695c; font-weight: bold;
`;
spinner.innerHTML = 'Carregando...';
document.body.appendChild(spinner);
spinner.style.display = 'none';

// Adiciona mensagem de dados ausentes
const msgSemDados = document.createElement('div');
msgSemDados.id = 'msgSemDados';
msgSemDados.style = `
  text-align: center; color: #c62828; font-size: 1.2rem; margin: 20px 0; display: none;
`;
msgSemDados.innerText = 'Nenhum dado encontrado para esta data.';
document.querySelector('.container').prepend(msgSemDados);

// Adiciona botão de exportação CSV
const btnExportCSV = document.createElement('button');
btnExportCSV.id = 'btnExportCSV';
btnExportCSV.innerText = 'Exportar CSV';
btnExportCSV.style = `
  margin-left: 12px; padding: 7px 16px; background-color: #388e3c; border: none;
  border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: background-color 0.3s ease;
`;
btnExportCSV.onmouseover = () => btnExportCSV.style.backgroundColor = '#00695c';
btnExportCSV.onmouseout = () => btnExportCSV.style.backgroundColor = '#388e3c';
document.getElementById('btnClearFilter').after(btnExportCSV);

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
  if (!valoresValidos.length) return {min: -10, max: 50}; // padrão se não houver dados
  let min = Math.min(...valoresValidos);
  let max = Math.max(...valoresValidos);
  min = Math.floor(min - 2);
  max = Math.ceil(max + 2);
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

  // Exibe ou oculta mensagem de dados ausentes
  if (dadosFiltrados.length === 0) {
    msgSemDados.style.display = 'block';
  } else {
    msgSemDados.style.display = 'none';
  }
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
            const hora = context.label;
            if (val === null) return 'Erro na leitura';
            return `Painel Brita | Horário: ${hora} | Temperatura: ${val} °C`;
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
        title: { display: true, text: 'Temperatura (°C)' }
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
            const hora = context.label;
            if (val === null) return 'Erro na leitura';
            return `Painel Vegetação | Horário: ${hora} | Temperatura: ${val} °C`;
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
        title: { display: true, text: 'Temperatura (°C)' }
      }
    }
  }
});

// Variáveis filtro
const inputDate = document.getElementById('filterDate');
const btnClearFilter = document.getElementById('btnClearFilter');

// Ao carregar dados do Firebase
refTemperaturas.on('value', (snapshot) => {
  spinner.style.display = 'flex'; // mostra spinner
  setTimeout(() => { // simula carregamento
    const dados = snapshot.val();
    spinner.style.display = 'none'; // esconde spinner
    if (!dados) {
      allDados = [];
      filtrarEAtualizar();
      return;
    }
    const chaves = Object.keys(dados).sort();
    allDados = chaves.map(chave => dados[chave]);
    // Se filtro vazio, seta para data atual
    if (!inputDate.value) {
      const hoje = new Date();
      const isoHoje = hoje.toISOString().split('T')[0];
      inputDate.value = isoHoje;
    }
    filtrarEAtualizar();
  }, 500); // tempo do spinner
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

// Exporta dados filtrados para CSV
btnExportCSV.addEventListener('click', () => {
  const dataSelecionada = inputDate.value;
  const dadosFiltrados = dataSelecionada
    ? allDados.filter(leitura => formatDateISO(leitura.timestamp) === dataSelecionada)
    : allDados;
  if (!dadosFiltrados.length) {
    alert('Nenhum dado para exportar!');
    return;
  }
  let csv = 'timestamp;temperaturaBrita;temperaturaVegetacao\n';
  function limparCampo(valor) {
    if (valor === null || valor === undefined) return '';
    // Se for número, troca ponto por vírgula
    if (!isNaN(valor) && typeof valor !== 'boolean' && valor !== '') {
      return String(valor).replace('.', ',');
    }
    return String(valor).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  }
  dadosFiltrados.forEach(leitura => {
    csv += `"${limparCampo(leitura.timestamp)}";"${limparCampo(leitura.temperaturaBrita)}";"${limparCampo(leitura.temperaturaVegetacao)}"\n`;
  });
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dados_painel_${dataSelecionada || 'todos'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Alternar modo escuro
const btnDarkMode = document.getElementById('btnDarkMode');
btnDarkMode.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  btnDarkMode.innerHTML = document.body.classList.contains('dark-mode')
    ? '☀️ Alternar modo claro'
    : '🌙 Alternar modo escuro';
});
