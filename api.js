/**
 * API Única - @MutanoX (ULTRA DARK INTEGRATED VERSION)
 * Consolidated endpoint for all queries and content generation
 * 
 * Port: 8080
 * Author: @MutanoX
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL, URLSearchParams } = require('url');

// ==========================================
// CONFIGURATIONS & AUTH SYSTEM (NEW)
// ==========================================

const PORT = 8080;
const API_KEYS_FILE = path.join(__dirname, 'api_keys.json');
const STATS_FILE = path.join(__dirname, 'api_stats.json');
const ENDPOINTS_FILE = path.join(__dirname, 'endpoints_config.json');
const ADMIN_KEY = 'MutanoX3397';
const DASHBOARD_PATH = path.join(__dirname, 'dashboards', 'dashboard_production.html');

// Configuração de Endpoints (Manutenção)
let endpointsConfig = {};
function loadEndpointsConfig() {
    if (fs.existsSync(ENDPOINTS_FILE)) {
        endpointsConfig = JSON.parse(fs.readFileSync(ENDPOINTS_FILE, 'utf8'));
    } else {
        const defaultEndpoints = ['cpf', 'nome', 'numero', 'bypass', 'bypasscf', 'infoff', 'downloader', 'github', 'gimage', 'pinterest', 'roblox', 'tiktok', 'yt', 'video', 'nsfw'];
        defaultEndpoints.forEach(e => { endpointsConfig[e] = { maintenance: false }; });
        saveEndpointsConfig();
    }
}
function saveEndpointsConfig() { fs.writeFileSync(ENDPOINTS_FILE, JSON.stringify(endpointsConfig, null, 2)); }
loadEndpointsConfig();

// Telemetria e Logs REAIS
let liveLogs = [];
let systemStats = {
    startTime: Date.now(),
    totalRequests: 0,
    endpointHits: {}
};

// Carregar estatísticas do arquivo
function loadStats() {
    if (fs.existsSync(STATS_FILE)) {
        try {
            const stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
            return {
                startTime: stats.startTime || Date.now(),
                totalRequests: stats.totalRequests || 0,
                endpointHits: stats.endpointHits || {}
            };
        } catch (error) {
            console.error('[loadStats] Erro ao carregar stats:', error.message);
        }
    }
    return null;
}

// Salvar estatísticas no arquivo
function saveStats() {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify({
            startTime: systemStats.startTime,
            totalRequests: systemStats.totalRequests,
            endpointHits: systemStats.endpointHits
        }, null, 2));
    } catch (error) {
        console.error('[saveStats] Erro ao salvar stats:', error.message);
    }
}

// Função para ler estatísticas sem incrementar
function getStatsOnly() {
    const keys = loadApiKeys();
    return {
        success: true,
        keys: keys,
        endpointHits: systemStats.endpointHits,
        totalRequests: systemStats.totalRequests,
        startTime: systemStats.startTime,
        uptime: Date.now() - systemStats.startTime,
        logs: liveLogs
    };
}

// Inicializar stats do arquivo
const loadedStats = loadStats();
if (loadedStats) {
    systemStats.startTime = loadedStats.startTime;
    systemStats.totalRequests = loadedStats.totalRequests;
    systemStats.endpointHits = loadedStats.endpointHits;
}

const colors = {
    reset: "\x1b[0m", bright: "\x1b[1m", dim: "\x1b[2m",
    fg: { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m", white: "\x1b[37m" }
};

function log(type, message, details = null) {
    const timestamp = new Date().toLocaleString('pt-BR');
    let prefix = '', color = colors.fg.white;
    switch (type.toUpperCase()) {
        case 'INFO': prefix = 'ℹ️ [INFO]'; color = colors.fg.cyan; break;
        case 'SUCCESS': prefix = '✅ [SUCESSO]'; color = colors.fg.green; break;
        case 'WARN': prefix = '⚠️ [AVISO]'; color = colors.fg.yellow; break;
        case 'ERROR': prefix = '❌ [ERRO]'; color = colors.fg.red; break;
        case 'AUTH': prefix = '🔐 [AUTH]'; color = colors.fg.magenta; break;
        case 'ADMIN': prefix = '👑 [ADMIN]'; color = colors.bright + colors.fg.yellow; break;
        case 'REQUEST': prefix = '🌐 [REQ]'; color = colors.fg.blue; break;
        default: prefix = '📝 [LOG]';
    }
    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${colors.bright}${prefix}${colors.reset} ${color}${message}${colors.reset}`);
    if (details) console.log(`${colors.dim}   └─> ${colors.reset}${colors.fg.white}${details}${colors.reset}`);
    liveLogs.unshift({ timestamp, type, message, details });
    if (liveLogs.length > 50) liveLogs.pop();
}

function generateUid(length = 16) { return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length); }

function loadApiKeys() {
    if (!fs.existsSync(API_KEYS_FILE)) {
        const initial = { [ADMIN_KEY]: { owner: "Admin", role: "admin", active: true, usageCount: 0, lastUsed: null, createdAt: new Date().toISOString() } };
        fs.writeFileSync(API_KEYS_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf8'));
}

function saveApiKeys(keys) { fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2)); }

function validateAndTrackKey(key, skipIncrement = false) {
    const keys = loadApiKeys();
    const keyData = keys[key];
    
    if (!keyData) return { valid: false };
    if (keyData.active === false) return { valid: false, error: 'Key inactive' };

    // Verificar validade temporal
    if (keyData.expiresAt) {
        if (new Date() > new Date(keyData.expiresAt)) {
            keyData.active = false;
            saveApiKeys(keys);
            return { valid: false, error: 'Key expired' };
        }
    }

    if (!skipIncrement) {
        // Ativação no primeiro uso
        if (keyData.duration && !keyData.expiresAt) {
            const now = new Date();
            if (keyData.duration === '1w') now.setDate(now.getDate() + 7);
            else if (keyData.duration === '1m') now.setMonth(now.getMonth() + 1);
            keyData.expiresAt = now.toISOString();
            log('AUTH', `Chave ativada: ${key}`, `Expira em: ${keyData.expiresAt}`);
        }

        keyData.usageCount = (keyData.usageCount || 0) + 1;
        keyData.lastUsed = new Date().toISOString();
        saveApiKeys(keys);
        systemStats.totalRequests++;
        saveStats();
    }
    
    return { valid: true, isAdmin: keyData.role === 'admin', owner: keyData.owner };
}

// ==========================================
// ORIGINAL CONFIGURATIONS (PRESERVED)
// ==========================================

const DEFAULT_VIDEO_API_KEY = 'MutanoXX';
const DEFAULT_IMAGE_API_KEY = 'freeApikey';
const DEFAULT_BYPASSCF_API_KEY = 'MutanoXX';
const DEFAULT_API_KEY = 'MutanoXX';

const BYPASS_TYPES = [
  'turnstile-min',
  'turnstile-max',
  'source',
  'waf-session',
  'hcaptcha-invisible',
  'recaptcha-v3',
  'recaptcha-v3-enterprise'
];

// ==========================================
// ORIGINAL UTILITY FUNCTIONS (PRESERVED)
// ==========================================

function isValidString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

function createApiUrl(baseUrl, params) {
  try {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
    return url.toString();
  } catch (error) {
    console.error('[createApiUrl] Erro ao criar URL:', error.message);
    return null;
  }
}

// ==========================================
// ORIGINAL PARSER FUNCTIONS (PRESERVED)
// ==========================================

function parseCPFData(text) {
  if (!isValidString(text)) {
    console.warn('[parseCPFData] Texto inválido recebido');
    return { erro: 'Resposta inválida da API', textoRecebido: text };
  }

  const data = {
    dadosBasicos: {},
    dadosEconomicos: {},
    enderecos: [],
    tituloEleitor: {},
    dadosFiscais: {},
    beneficiosSociais: [],
    pessoaExpostaPoliticamente: {},
    servidorPublico: {},
    perfilConsumo: {},
    vacinas: [],
    informacoesImportantes: {}
  };

  const nomeMatch = text.match(/• Nome: (.+)/);
  if (nomeMatch) data.dadosBasicos.nome = nomeMatch[1].trim();

  const cpfMatch = text.match(/• CPF: (\d+)/);
  if (cpfMatch) data.dadosBasicos.cpf = cpfMatch[1];

  const cnsMatch = text.match(/• CNS: (\d+)/);
  if (cnsMatch) data.dadosBasicos.cns = cnsMatch[1];

  const dataNascimentoMatch = text.match(/• Data de Nascimento: (.+)/);
  if (dataNascimentoMatch) data.dadosBasicos.dataNascimento = dataNascimentoMatch[1].trim();

  const sexoMatch = text.match(/• Sexo: (.+)/);
  if (sexoMatch) data.dadosBasicos.sexo = sexoMatch[1].trim();

  const nomeMaeMatch = text.match(/• Nome da Mãe: (.+)/);
  if (nomeMaeMatch) data.dadosBasicos.nomeMae = nomeMaeMatch[1].trim();

  const nomePaiMatch = text.match(/• Nome do Pai: (.+)/);
  if (nomePaiMatch) data.dadosBasicos.nomePai = nomePaiMatch[1].trim();

  const situacaoCadastralMatch = text.match(/• Situação Cadastral: (.+)/);
  if (situacaoCadastralMatch) data.dadosBasicos.situacaoCadastral = situacaoCadastralMatch[1].trim();

  const dataSituacaoMatch = text.match(/• Data da Situação: (.+)/);
  if (dataSituacaoMatch) data.dadosBasicos.dataSituacao = dataSituacaoMatch[1].trim();

  const rendaMatch = text.match(/• Renda: (.+)/);
  if (rendaMatch) data.dadosEconomicos.renda = rendaMatch[1].trim();

  const poderAquisitivoMatch = text.match(/• Poder Aquisitivo: (.+)/);
  if (poderAquisitivoMatch) data.dadosEconomicos.poderAquisitivo = poderAquisitivoMatch[1].trim();

  const faixaRendaMatch = text.match(/• Faixa de Renda: (.+)/);
  if (faixaRendaMatch) data.dadosEconomicos.faixaRenda = faixaRendaMatch[1].trim();

  const scoreMatch = text.match(/• Score CSBA: (.+)/);
  if (scoreMatch) data.dadosEconomicos.scoreCSBA = scoreMatch[1].trim();

  const addressBlocks = text.split('🏠 ENDEREÇO');
  for (let i = 1; i < addressBlocks.length; i++) {
    const endereco = {};
    const logradouroMatch = addressBlocks[i].match(/• Logradouro:\s*(.+)/);
    if (logradouroMatch) endereco.logradouro = logradouroMatch[1].trim();

    const bairroMatch = addressBlocks[i].match(/• Bairro:\s*(.+)/);
    if (bairroMatch) endereco.bairro = bairroMatch[1].trim();

    const cidadeMatch = addressBlocks[i].match(/• Cidade\/UF:\s*(.+)/);
    if (cidadeMatch) endereco.cidadeUF = cidadeMatch[1].trim();

    const cepMatch = addressBlocks[i].match(/• CEP:\s*(.+)/);
    if (cepMatch) endereco.cep = cepMatch[1].trim();

    if (Object.keys(endereco).length > 0) {
      data.enderecos.push(endereco);
    }
  }

  const cpfValidoMatch = text.match(/• CPF Válido: (.+)/);
  if (cpfValidoMatch) data.informacoesImportantes.cpfValido = cpfValidoMatch[1].trim();

  const obitoInfoMatch = text.match(/• Óbito: (.+)/);
  if (obitoInfoMatch) data.informacoesImportantes.obito = obitoInfoMatch[1].trim();

  const pepInfoMatch = text.match(/• PEP: (.+)/);
  if (pepInfoMatch) data.informacoesImportantes.pep = pepInfoMatch[1].trim();

  return data;
}

function parseNomeData(text) {
  if (!isValidString(text)) return [];

  const results = [];
  const pessoaBlocks = text.split('👤 RESULTADO');
  for (let i = 1; i < pessoaBlocks.length; i++) {
    const pessoa = {};
    const cpfMatch = pessoaBlocks[i].match(/• CPF: (\d+)/);
    if (cpfMatch) pessoa.cpf = cpfMatch[1];

    const nomeMatch = pessoaBlocks[i].match(/• Nome: (.+)/);
    if (nomeMatch) pessoa.nome = nomeMatch[1].trim();

    const dataNascimentoMatch = pessoaBlocks[i].match(/• Data de Nascimento: (.+)/);
    if (dataNascimentoMatch) pessoa.dataNascimento = dataNascimentoMatch[1].trim();

    const nomeMaeMatch = pessoaBlocks[i].match(/• Nome da Mãe: (.+)/);
    if (nomeMaeMatch) pessoa.nomeMae = nomeMaeMatch[1].trim();

    const situacaoCadastralMatch = pessoaBlocks[i].match(/• Situação Cadastral: (.+)/);
    if (situacaoCadastralMatch) pessoa.situacaoCadastral = situacaoCadastralMatch[1].trim();

    const logradouroMatch = pessoaBlocks[i].match(/• Logradouro: (.+)/);
    if (logradouroMatch) pessoa.logradouro = logradouroMatch[1].trim();

    const bairroMatch = pessoaBlocks[i].match(/• Bairro: (.+)/);
    if (bairroMatch) pessoa.bairro = bairroMatch[1].trim();

    const cepMatch = pessoaBlocks[i].match(/• CEP: (\d+)/);
    if (cepMatch) pessoa.cep = cepMatch[1];

    results.push(pessoa);
  }
  return results;
}

function parseTelefoneData(text) {
  if (!isValidString(text)) return [];

  const results = [];
  const pessoaBlocks = text.split('👤 PESSOA');
  for (let i = 1; i < pessoaBlocks.length; i++) {
    const pessoa = {};
    const cpfCnpjMatch = pessoaBlocks[i].match(/• CPF\/CNPJ: (.+)/);
    if (cpfCnpjMatch) pessoa.cpfCnpj = cpfCnpjMatch[1].trim();

    const nomeMatch = pessoaBlocks[i].match(/• Nome: (.+)/);
    if (nomeMatch) pessoa.nome = nomeMatch[1].trim();

    const dataNascimentoMatch = pessoaBlocks[i].match(/• Data de Nascimento: (.+)/);
    if (dataNascimentoMatch) pessoa.dataNascimento = dataNascimentoMatch[1].trim();

    const bairroMatch = pessoaBlocks[i].match(/• Bairro: (.+)/);
    if (bairroMatch) pessoa.bairro = bairroMatch[1].trim();

    const cidadeUfMatch = pessoaBlocks[i].match(/• Cidade\/UF: (.+)/);
    if (cidadeUfMatch) pessoa.cidadeUF = cidadeUfMatch[1].trim();

    const cepMatch = pessoaBlocks[i].match(/• CEP: (\d+)/);
    if (cepMatch) pessoa.cep = cepMatch[1];

    results.push(pessoa);
  }
  return results;
}

// ==========================================
// ORIGINAL API HANDLERS (PRESERVED)
// ==========================================

async function consultarCPF(cpf) {
  if (!isValidString(cpf)) {
    return { sucesso: false, erro: 'CPF inválido ou vazio', criador: '@MutanoX' };
  }

  try {
    const apiUrl = createApiUrl('https://world-ecletix.onrender.com/api/consultarcpf', { cpf });
    if (!apiUrl) throw new Error('URL inválida');

    console.log('[consultarCPF] Consultando CPF:', cpf);
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    if (!data || !data.resultado) {
      return { sucesso: false, erro: 'Resposta inválida da API', resposta: data, criador: '@MutanoX' };
    }

    const parsedData = parseCPFData(data.resultado);
    return { sucesso: true, dados: parsedData, criador: '@MutanoX' };
  } catch (error) {
    console.error('[consultarCPF] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function consultarNome(nome) {
  if (!isValidString(nome)) {
    return { sucesso: false, erro: 'Nome inválido ou vazio', criador: '@MutanoX' };
  }

  try {
    const apiUrl = createApiUrl('https://world-ecletix.onrender.com/api/nome-completo', { q: nome });
    if (!apiUrl) throw new Error('URL inválida');

    console.log('[consultarNome] Consultando nome:', nome);
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    if (!data || !data.resultado) {
      return { sucesso: false, erro: 'Resposta inválida da API', resposta: data, criador: '@MutanoX' };
    }

    const parsedData = parseNomeData(data.resultado);
    return { sucesso: true, totalResultados: parsedData.length, resultados: parsedData, criador: '@MutanoX' };
  } catch (error) {
    console.error('[consultarNome] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function consultarNumero(numero) {
  if (!isValidString(numero)) {
    return { sucesso: false, erro: 'Número inválido ou vazio', criador: '@MutanoX' };
  }

  try {
    const apiUrl = createApiUrl('https://world-ecletix.onrender.com/api/numero', { q: numero });
    if (!apiUrl) throw new Error('URL inválida');

    console.log('[consultarNumero] Consultando número:', numero);
    const response = await fetch(apiUrl);
    
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    if (!data || !data.resultado) {
      return { sucesso: false, erro: 'Resposta inválida da API', resposta: data, criador: '@MutanoX' };
    }

    const parsedData = parseTelefoneData(data.resultado);
    return { sucesso: true, totalResultados: parsedData.length, resultados: parsedData, criador: '@MutanoX' };
  } catch (error) {
    console.error('[consultarNumero] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function bypassCloudflare(url, siteKey, type, proxy, apikey) {
  if (!isValidString(url) || !isValidUrl(url)) {
    return { sucesso: false, erro: 'URL inválida ou vazia', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_BYPASSCF_API_KEY;
  if (!isValidString(siteKey)) siteKey = '0x4AAAAAAAdJZmNxW54o-Gvd';
  if (!isValidString(type)) type = 'turnstile-min';

  try {
    console.log('[bypassCloudflare] Iniciando bypass:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/tools/bypasscf', { url, siteKey, type, proxy, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success, data: data.data || data, criador: '@MutanoX' };
  } catch (error) {
    console.error('[bypassCloudflare] Erro:', error.message);
    let msg = 'Erro ao realizar bypass';
    if (error.name === 'AbortError') msg = 'Tempo limite excedido (2 minutos)';
    return { sucesso: false, erro: msg, criador: '@MutanoX' };
  }
}

async function textToVideo(prompt, quality, ratio, apikey) {
  if (!isValidString(prompt)) {
    return { sucesso: false, erro: 'Prompt inválido ou vazio', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_VIDEO_API_KEY;
  if (!isValidString(quality)) quality = '1080p';
  if (!isValidString(ratio)) ratio = '9:16';

  try {
    console.log('[textToVideo] Gerando vídeo:', prompt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/ai/text2video', { prompt, quality, ratio, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { success: data.success, video_url: data.data?.result || null, prompt, quality, ratio, criador: '@MutanoX' };
  } catch (error) {
    console.error('[textToVideo] Erro:', error.message);
    let msg = 'Erro ao gerar vídeo';
    if (error.name === 'AbortError') msg = 'Tempo limite excedido (5 minutos)';
    return { success: false, erro: msg, criador: '@MutanoX' };
  }
}

async function nsfwImageGen(prompt, negative, apikey) {
  if (!isValidString(prompt)) {
    return { sucesso: false, erro: 'Prompt inválido ou vazio', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_IMAGE_API_KEY;
  if (!isValidString(negative)) negative = 'blurry,low quality';

  try {
    console.log('[nsfwImageGen] Gerando imagem NSFW:', prompt);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/ai/dalle3', { prompt, negative, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { success: data.success, image_url: data.data?.result || null, prompt, negative, criador: '@MutanoX' };
  } catch (error) {
    console.error('[nsfwImageGen] Erro:', error.message);
    let msg = 'Erro ao gerar imagem NSFW';
    if (error.name === 'AbortError') msg = 'Tempo limite excedido (3 minutos)';
    return { success: false, erro: msg, criador: '@MutanoX' };
  }
}

async function consultarInfoFF(id) {
  if (!isValidString(id)) {
    return { sucesso: false, erro: 'ID inválido ou vazio', criador: '@MutanoX' };
  }

  try {
    console.log('[consultarInfoFF] Consultando ID:', id);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://world-ecletix.onrender.com/api/infoff', { id });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: true, id, dados: data, criador: '@MutanoX' };
  } catch (error) {
    console.error('[consultarInfoFF] Erro:', error.message);
    let msg = 'Erro ao consultar informações da conta Free Fire';
    if (error.name === 'AbortError') msg = 'Tempo limite excedido (1 minuto)';
    return { sucesso: false, erro: msg, criador: '@MutanoX' };
  }
}

async function allInOneDownloader(urlParam, apikey) {
  if (!isValidString(urlParam) || !isValidUrl(urlParam)) {
    return { sucesso: false, erro: 'URL inválida ou vazia', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[allInOneDownloader] Iniciando download:', urlParam);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/download/aio', { url: urlParam, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, criador: '@MutanoX' };
  } catch (error) {
    console.error('[allInOneDownloader] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function githubSearch(username, apikey) {
  if (!isValidString(username)) {
    return { sucesso: false, erro: 'Username inválido ou vazio', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[githubSearch] Buscando usuário:', username);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/search/githubSearch', { username, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, username, criador: '@MutanoX' };
  } catch (error) {
    console.error('[githubSearch] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function googleImage(query, apikey) {
  if (!isValidString(query)) {
    return { sucesso: false, erro: 'Query inválida ou vazia', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[googleImage] Buscando imagens:', query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/search/gimage', { query, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, query, criador: '@MutanoX' };
  } catch (error) {
    console.error('[googleImage] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function pinterest(query, apikey) {
  if (!isValidString(query)) {
    return { sucesso: false, erro: 'Query inválida ou vazia', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[pinterest] Buscando imagens:', query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/search/pinterest', { query, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, query, criador: '@MutanoX' };
  } catch (error) {
    console.error('[pinterest] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function robloxStalk(username, apikey) {
  if (!isValidString(username)) {
    return { sucesso: false, erro: 'Username inválido ou vazio', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[robloxStalk] Buscando usuário:', username);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/search/robloxStalk', { username, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, username, criador: '@MutanoX' };
  } catch (error) {
    console.error('[robloxStalk] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function tiktokSearch(username, apikey) {
  if (!isValidString(username)) {
    return { sucesso: false, erro: 'Username inválido ou vazio', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[tiktokSearch] Buscando usuário:', username);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/search/tiktokSearch', { username, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, username, criador: '@MutanoX' };
  } catch (error) {
    console.error('[tiktokSearch] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function youtubeSearch(query, apikey) {
  if (!isValidString(query)) {
    return { sucesso: false, erro: 'Query inválida ou vazia', criador: '@MutanoX' };
  }

  if (!isValidString(apikey)) apikey = DEFAULT_API_KEY;

  try {
    console.log('[youtubeSearch] Buscando vídeos:', query);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const apiUrl = createApiUrl('https://anabot.my.id/api/search/ytSearch', { query, apikey });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, { method: 'GET', signal: controller.signal });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.success !== undefined ? data.success : true, dados: data, query, criador: '@MutanoX' };
  } catch (error) {
    console.error('[youtubeSearch] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

async function bypassCity(urlParam) {
  if (!isValidString(urlParam) || !isValidUrl(urlParam)) {
    return { sucesso: false, erro: 'URL inválida ou vazia', criador: '@MutanoX' };
  }

  try {
    console.log('[bypassCity] Iniciando bypass:', urlParam);

    const apiUrl = createApiUrl('https://api.paxsenix.org/tools/bypass-city', { url: urlParam });
    if (!apiUrl) throw new Error('URL inválida');

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-paxsenix-JunMXU0cPmFt8HiC0F5zW1N0ow1lI509oyE3YuQycWfFjm2f'
      }
    });

    if (!response.ok) throw new Error(`API retornou status ${response.status}`);

    const data = await response.json();
    return { sucesso: data.ok !== undefined ? data.ok : true, data: data.data || null, isPaste: data.isPaste, name: data.name, paste: data.paste, supportedLinks: data.supportedLinks, embedData: data.embedData, criador: '@MutanoX' };
  } catch (error) {
    console.error('[bypassCity] Erro:', error.message);
    return { sucesso: false, erro: error.message, criador: '@MutanoX' };
  }
}

// ==========================================
// HTTP SERVER (INTEGRATED)
// ==========================================

const server = http.createServer(async (req, res) => {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  } catch (error) {
    console.error('[Server] URL inválida:', error.message);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'URL inválida', criador: '@MutanoX' }));
    return;
  }

  const query = Object.fromEntries(parsedUrl.searchParams);
  const path = parsedUrl.pathname;
  const apiKey = query.apikey || req.headers['x-api-key'];
  const userAgent = req.headers['user-agent'] || 'Unknown';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // SERVIR DASHBOARD (NEW)
  if (path === '/admin' || path === '/dashboard') {
      if (fs.existsSync(DASHBOARD_PATH)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fs.readFileSync(DASHBOARD_PATH));
          return;
      } else {
          res.writeHead(404); res.end('Dashboard file not found');
          return;
      }
  }

  // SERVIR ARQUIVOS ESTÁTICOS DO DASHBOARD
  if (path.startsWith('/dashboards/')) {
      const relativePath = path.replace(/^\/dashboards\//, '');
      const filePath = require('path').join(__dirname, 'dashboards', relativePath);
      if (fs.existsSync(filePath)) {
          const ext = path.split('.').pop();
          const contentType = ext === 'js' ? 'application/javascript' : 'text/css';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(fs.readFileSync(filePath));
          return;
      }
  }

  // AUTHENTICATION (NEW)
  const auth = validateAndTrackKey(apiKey, path.startsWith('/api/admin/') ? true : false);
  const logMsg = `Usuário: ${auth.valid ? auth.owner : 'DESCONHECIDO'} | Rota: ${path}`;
  const logDetails = `Key: ${apiKey || 'Nenhuma'} | UA: ${userAgent}`;

  // ADMIN ENDPOINTS (NEW)
  if (path.startsWith('/api/admin/')) {
      if (path === '/api/admin/validate') {
          if (apiKey === ADMIN_KEY) {
              res.writeHead(200); res.end(JSON.stringify({ success: true }));
          } else {
              res.writeHead(401); res.end(JSON.stringify({ success: false }));
          }
          return;
      }

      if (!auth.isAdmin) {
          log('AUTH', `Acesso negado ao Admin: ${logMsg}`, logDetails);
          res.writeHead(403); res.end(JSON.stringify({ success: false, error: 'Admin required' }));
          return;
      }

      const keys = loadApiKeys();

      if (path === '/api/admin/stats' && req.method === 'GET') {
          res.writeHead(200); res.end(JSON.stringify({ success: true, keys, endpointHits: systemStats.endpointHits, totalRequests: systemStats.totalRequests, uptime: Date.now() - systemStats.startTime }));
      } else if (path === '/api/admin/stats-readonly' && req.method === 'GET') {
          // Endpoint readonly para dashboard (NÃO incrementa contadores)
          res.writeHead(200); res.end(JSON.stringify(getStatsOnly()));
      } else if (path === '/api/admin/keys' && req.method === 'GET') {
          res.writeHead(200); res.end(JSON.stringify({ success: true, keys }));
      } else if (path === '/api/admin/logs' && req.method === 'GET') {
          res.writeHead(200); res.end(JSON.stringify({ success: true, logs: liveLogs }));
      } else if (path === '/api/admin/keys' && req.method === 'POST') {
          const owner = query.owner;
          if (!owner) { res.writeHead(400); res.end(JSON.stringify({ success: false, error: 'Owner required' })); return; }
          const newKey = `MutanoX-${generateUid(16)}`;
          keys[newKey] = { owner, role: query.role || 'user', active: true, usageCount: 0, lastUsed: null, createdAt: new Date().toISOString() };
          saveApiKeys(keys);
          log('ADMIN', `Nova chave: ${newKey}`, `Dono: ${owner}`);
          res.writeHead(201); res.end(JSON.stringify({ success: true, key: newKey, owner }));
      } else if (path === '/api/admin/toggle' && req.method === 'POST') {
          const target = query.target;
          if (!target || !keys[target]) { res.writeHead(404); res.end(JSON.stringify({ success: false, error: 'Key not found' })); return; }
          keys[target].active = !keys[target].active;
          saveApiKeys(keys);
          log('ADMIN', `Status alterado: ${target}`, `Novo status: ${keys[target].active ? 'ATIVO' : 'INATIVO'}`);
          res.writeHead(200); res.end(JSON.stringify({ success: true, key: target, active: keys[target].active }));
      } else if (path === '/api/admin/keys' && req.method === 'DELETE') {
          const target = query.target;
          if (!target || !keys[target] || target === ADMIN_KEY) { res.writeHead(400); res.end(JSON.stringify({ success: false, error: 'Invalid target' })); return; }
          delete keys[target];
          saveApiKeys(keys);
          log('ADMIN', `Chave removida: ${target}`);
          res.writeHead(200); res.end(JSON.stringify({ success: true, message: 'Key deleted' }));
      } else if (path === '/api/admin/endpoints' && req.method === 'GET') {
          res.writeHead(200); res.end(JSON.stringify({ success: true, config: endpointsConfig }));
      } else if (path === '/api/admin/endpoints/toggle' && req.method === 'POST') {
          const target = query.target;
          if (!target || !endpointsConfig[target]) { res.writeHead(404); res.end(JSON.stringify({ success: false, error: 'Endpoint not found' })); return; }
          endpointsConfig[target].maintenance = !endpointsConfig[target].maintenance;
          saveEndpointsConfig();
          log('ADMIN', `Manutenção alterada: ${target}`, `Status: ${endpointsConfig[target].maintenance ? 'ON' : 'OFF'}`);
          res.writeHead(200); res.end(JSON.stringify({ success: true, endpoint: target, maintenance: endpointsConfig[target].maintenance }));
      } else if (path === '/api/admin/keys/bulk' && req.method === 'POST') {
          const count = parseInt(query.count) || 1;
          const owner = query.owner || 'Bulk User';
          const duration = query.duration || null;
          const newKeys = [];
          for (let i = 0; i < count; i++) {
              const newKey = `MutanoX-${generateUid(16)}`;
              keys[newKey] = { owner: `${owner} ${i+1}`, role: 'user', active: true, usageCount: 0, lastUsed: null, createdAt: new Date().toISOString(), duration };
              newKeys.push(newKey);
          }
          saveApiKeys(keys);
          log('ADMIN', `Criação em lote: ${count} chaves`, `Dono: ${owner}`);
          res.writeHead(201); res.end(JSON.stringify({ success: true, keys: newKeys }));
      }
      return;
  }

  // PUBLIC API ENDPOINTS (WITH AUTH)
  if (!apiKey || !auth.valid) {
      log('AUTH', `Acesso negado: ${logMsg}`, logDetails);
      res.writeHead(401);
      res.end(JSON.stringify({ success: false, error: 'Invalid or missing API Key' }));
      return;
  }

  log('REQUEST', logMsg, logDetails);

  try {
    if (path === '/api/consultas') {
      const tipo = query.tipo;

      if (!tipo) {
        res.writeHead(400);
        res.end(JSON.stringify({
          sucesso: false,
          erro: 'Tipo de consulta não especificado',
          tiposDisponiveis: ['cpf', 'nome', 'numero', 'bypass', 'bypasscf', 'infoff', 'downloader', 'github', 'gimage', 'pinterest', 'roblox', 'tiktok', 'yt', 'video', 'nsfw'],
          criador: '@MutanoX'
        }, null, 2));
        return;
      }

      // Verificar Manutenção
      const endpointKey = tipo.toLowerCase();
      if (endpointsConfig[endpointKey] && endpointsConfig[endpointKey].maintenance) {
          log('WARN', `Tentativa de acesso a endpoint em manutenção: ${endpointKey}`);
          res.writeHead(503);
          res.end(JSON.stringify({ sucesso: false, erro: 'Este endpoint está em manutenção temporária' }));
          return;
      }

      systemStats.endpointHits[endpointKey] = (systemStats.endpointHits[endpointKey] || 0) + 1;
      saveStats(); // Salvar endpointHits persistentemente
      let result;

      switch (tipo.toLowerCase()) {
        case 'cpf':
          result = await consultarCPF(query.cpf);
          break;
        case 'nome':
          result = await consultarNome(query.q);
          break;
        case 'numero':
          result = await consultarNumero(query.q);
          break;
        case 'bypass':
          result = await bypassCity(query.url);
          break;
        case 'bypasscf':
          result = await bypassCloudflare(query.url, query.siteKey || '0x4AAAAAAAdJZmNxW54o-Gvd', query.type || 'turnstile-min', query.proxy || '', query.apikey || DEFAULT_BYPASSCF_API_KEY);
          break;
        case 'infoff':
          result = await consultarInfoFF(query.id);
          break;
        case 'downloader':
          result = await allInOneDownloader(query.url, query.apikey || DEFAULT_API_KEY);
          break;
        case 'github':
          result = await githubSearch(query.username, query.apikey || DEFAULT_API_KEY);
          break;
        case 'gimage':
          result = await googleImage(query.q || query.query, query.apikey || DEFAULT_API_KEY);
          break;
        case 'pinterest':
          result = await pinterest(query.q || query.query, query.apikey || DEFAULT_API_KEY);
          break;
        case 'roblox':
          result = await robloxStalk(query.username, query.apikey || DEFAULT_API_KEY);
          break;
        case 'tiktok':
          result = await tiktokSearch(query.username, query.apikey || DEFAULT_API_KEY);
          break;
        case 'yt':
          result = await youtubeSearch(query.q || query.query, query.apikey || DEFAULT_API_KEY);
          break;
        case 'video':
          result = await textToVideo(query.prompt, query.quality || '1080p', query.ratio || '9:16', query.apikey || DEFAULT_VIDEO_API_KEY);
          break;
        case 'nsfw':
          result = await nsfwImageGen(query.prompt, query.negative || 'blurry,low quality', query.apikey || DEFAULT_IMAGE_API_KEY);
          break;
        default:
          res.writeHead(400);
          result = { sucesso: false, erro: `Tipo desconhecido: ${tipo}`, criador: '@MutanoX' };
      }

      res.writeHead(200);
      res.end(JSON.stringify(result, null, 2));
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlInfo);
    }
  } catch (error) {
    console.error('[Server] Erro:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ sucesso: false, erro: 'Erro interno do servidor', detalhes: error.message, criador: '@MutanoX' }, null, 2));
  }
});

const htmlInfo = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Única - @MutanoX</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #0a0e27; color: #00ff00; padding: 20px; margin: 0; }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 { text-align: center; color: #00ffff; text-shadow: 0 0 10px #00ffff; }
        .endpoint { background: #1a1e3f; border-left: 4px solid #00ff00; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .endpoint code { background: #0a0e27; padding: 2px 6px; color: #00ffff; border-radius: 3px; }
        .status { text-align: center; color: #00ff00; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 API Única - @MutanoX</h1>
        <p class="status">✅ Servidor rodando na porta 8080</p>
        <h2>📡 Endpoints Disponíveis</h2>
        <div class="endpoint"><strong>CPF:</strong><br><code>/api/consultas?tipo=cpf&cpf=XXXXX</code></div>
        <div class="endpoint"><strong>Nome:</strong><br><code>/api/consultas?tipo=nome&q=NOME</code></div>
        <div class="endpoint"><strong>Número:</strong><br><code>/api/consultas?tipo=numero&q=NUMERO</code></div>
        <div class="endpoint"><strong>Bypass Cloudflare:</strong><br><code>/api/consultas?tipo=bypasscf&url=URL&type=turnstile-min</code></div>
        <div class="endpoint"><strong>Info Free Fire:</strong><br><code>/api/consultas?tipo=infoff&id=ID_CONTA</code></div>
        <div class="endpoint"><strong>Download:</strong><br><code>/api/consultas?tipo=downloader&url=URL</code></div>
        <div class="endpoint"><strong>GitHub:</strong><br><code>/api/consultas?tipo=github&username=USERNAME</code></div>
        <div class="endpoint"><strong>Google Imagens:</strong><br><code>/api/consultas?tipo=gimage&q=QUERY</code></div>
        <div class="endpoint"><strong>Pinterest:</strong><br><code>/api/consultas?tipo=pinterest&q=QUERY</code></div>
        <div class="endpoint"><strong>Roblox:</strong><br><code>/api/consultas?tipo=roblox&username=USERNAME</code></div>
        <div class="endpoint"><strong>TikTok:</strong><br><code>/api/consultas?tipo=tiktok&username=USERNAME</code></div>
        <div class="endpoint"><strong>YouTube:</strong><br><code>/api/consultas?tipo=yt&q=QUERY</code></div>
        <div class="endpoint"><strong>Vídeo:</strong><br><code>/api/consultas?tipo=video&prompt=PROMPT&quality=1080p&ratio=9:16</code></div>
        <div class="endpoint"><strong>Imagem NSFW:</strong><br><code>/api/consultas?tipo=nsfw&prompt=PROMPT</code></div>
    </div>
</body>
</html>`;

server.listen(PORT, () => {
    console.clear();
    console.log(`${colors.fg.green}${colors.bright}  MUTANOX ULTRA DARK COMMAND - V3.5  ${colors.reset}\n`);
    log('SUCCESS', `Servidor rodando na porta ${PORT}`);
    log('INFO', `Dashboard: http://localhost:${PORT}/admin`);
    // log('ADMIN', `Admin Key: ${ADMIN_KEY}`);
});
