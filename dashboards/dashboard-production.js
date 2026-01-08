
// CONFIGURATION
const API_BASE = '';
let adminKey = localStorage.getItem('mutanox_admin_key') || '';
let refreshInterval = null;
let refreshRate = 2000;
let lastData = null;
let chartAnimation = true;
let endpointChart = null;
let timelineChart = null;
let logFilter = 'all';
let currentTab = 'dashboard';
let currentChartType = 'doughnut';
let requestHistory = [];

// Endpoint configurations
const endpointConfigs = {
    'cpf': {
        name: 'Consultar CPF',
        description: 'Consulta completa de CPF com dados básicos, econômicos e endereços',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=cpf&cpf=XXX',
        icon: 'fa-id-card',
        color: '#10b981'
    },
    'nome': {
        name: 'Consultar Nome',
        description: 'Busca por nome completo com múltiplos resultados',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=nome&q=XXX',
        icon: 'fa-user',
        color: '#6366f1'
    },
    'numero': {
        name: 'Consultar Telefone',
        description: 'Consulta de telefone com dados da pessoa associada',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=numero&q=XXX',
        icon: 'fa-phone',
        color: '#f59e0b'
    },
    'bypasscf': {
        name: 'Bypass Cloudflare',
        description: 'Bypass de proteção Cloudflare Turnstile/WAF',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=bypasscf&url=XXX',
        icon: 'fa-shield-virus',
        color: '#ef4444'
    },
    'infoff': {
        name: 'Free Fire Info',
        description: 'Consulta de informações de conta Free Fire',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=infoff&id=XXX',
        icon: 'fa-gamepad',
        color: '#8b5cf6'
    },
    'downloader': {
        name: 'AIO Downloader',
        description: 'Download de vídeos e mídias de várias redes sociais',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=downloader&url=XXX',
        icon: 'fa-download',
        color: '#06b6d4'
    },
    'nsfw': {
        name: 'NSFW Gen',
        description: 'Geração de imagens NSFW via IA',
        method: 'GET',
        path: '/api/consultas',
        params: 'tipo=nsfw&prompt=XXX',
        icon: 'fa-image',
        color: '#f97316'
    }
};

// Helper function to safely get element
function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`[safeGetElement] Element with id "${id}" not found!`);
    }
    return el;
}

// Helper function to safely set innerHTML
function safeSetInnerHTML(id, html) {
    const el = safeGetElement(id);
    if (!el) return;
    
    try {
        el.innerHTML = html;
    } catch (error) {
        console.error(`[safeSetInnerHTML] Error setting innerHTML for id "${id}":`, error);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOMContentLoaded] DOM loaded');
    
    if (adminKey) {
        console.log('[DOMContentLoaded] Admin key found:', adminKey);
        showDashboard();
    } else {
        console.log('[DOMContentLoaded] No admin key, showing login');
    }
});

// Login function
window.login = async function() {
    const keyInput = document.getElementById('admin-key-input') || document.querySelector('input[type="password"]');
    if (!keyInput) {
        console.error('[login] Login input not found!');
        showToast('error', 'Elemento de login não encontrado');
        return;
    }
    
    const key = keyInput.value;
    console.log('[login] Attempting login with key:', key);
    
    if (!key) {
        showToast('error', 'Por favor, insira uma API key');
        return;
    }

    try {
        const response = await fetch(`/api/admin/validate?apikey=${key}`);
        console.log('[login] Response status:', response.status);
        
        if (response.ok) {
            adminKey = key;
            localStorage.setItem('mutanox_admin_key', key);
            showToast('success', 'Authentication successful');
            showDashboard();
        } else {
            const errorEl = safeGetElement('login-error');
            if (errorEl) {
                errorEl.classList.remove('hidden');
                setTimeout(() => errorEl.classList.add('hidden'), 3000);
            }
        }
    } catch (error) {
        console.error('[login] Error:', error);
        showToast('error', 'Connection error: ' + error.message);
    }
}

window.logout = function() {
    console.log('[logout] Logging out...');
    localStorage.removeItem('mutanox_admin_key');
    adminKey = '';
    clearInterval(refreshInterval);
    location.reload();
}

function showDashboard() {
    console.log('[showDashboard] Showing dashboard...');
    
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
        loginOverlay.classList.add('hidden');
    }
    if (dashboardContent) {
        dashboardContent.style.display = 'block';
        dashboardContent.classList.remove('hidden');
    }
    
    initCharts();
    startAutoRefresh();
}

// Tab switching
window.switchTab = function(tab) {
    console.log('[switchTab] Switching to tab:', tab);
    currentTab = tab;
    
    // Hide all content
    ['dashboard', 'keys', 'endpoints', 'logs'].forEach(t => {
        const contentEl = safeGetElement(`content-${t}`);
        if (contentEl) contentEl.classList.add('hidden');
        
        const btnEl = safeGetElement(`tab-${t}`);
        if (btnEl) btnEl.classList.remove('active');
    });
    
    // Show selected content
    const activeContent = safeGetElement(`content-${tab}`);
    if (activeContent) activeContent.classList.remove('hidden');
    
    const activeBtn = safeGetElement(`tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('active');
}

// Charts initialization
function initCharts() {
    console.log('[initCharts] Initializing charts...');
    destroyCharts();
    
    const endpointCtx = safeGetElement('endpointChart');
    if (!endpointCtx) {
        console.error('[initCharts] endpointChart canvas not found!');
        return;
    }
    
    console.log('[initCharts] endpointChart canvas found, creating chart...');
    
    endpointChart = new Chart(endpointCtx, {
        type: currentChartType,
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#10b981', '#6366f1', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#06b6d4', '#f97316'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            cutout: '70%'
        }
    });

    console.log('[initCharts] endpointChart created successfully');

    // Timeline Chart
    const timelineCtx = safeGetElement('timelineChart');
    if (!timelineCtx) {
        console.error('[initCharts] timelineChart canvas not found!');
        return;
    }
    
    console.log('[initCharts] timelineChart canvas found, creating chart...');
    
    timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Requests per Interval',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true },
                x: { display: false }
            }
        }
    });
    
    console.log('[initCharts] timelineChart created successfully');
}

// Destroy all charts
function destroyCharts() {
    console.log('[destroyCharts] Destroying existing charts...');
    
    if (endpointChart) {
        endpointChart.destroy();
        endpointChart = null;
        console.log('[destroyCharts] endpointChart destroyed');
    }
    
    if (timelineChart) {
        timelineChart.destroy();
        timelineChart = null;
        console.log('[destroyCharts] timelineChart destroyed');
    }
}

// Auto refresh
function startAutoRefresh() {
    console.log('[startAutoRefresh] Starting auto refresh...');
    refreshData();
    refreshInterval = setInterval(refreshData, refreshRate);
}

// Toggle auto refresh
window.toggleAutoRefresh = function() {
    const toggle = document.getElementById('auto-refresh-toggle');
    if (!toggle) return;
    
    if (toggle.checked) {
        console.log('[AutoRefresh] Enabled');
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(refreshData, refreshRate);
    } else {
        console.log('[AutoRefresh] Disabled');
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

// Inicializar listener se o elemento existir
const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('change', window.toggleAutoRefresh);
}

// Force refresh
window.forceRefresh = function() {
    const refreshIcon = safeGetElement('refresh-icon');
    if (refreshIcon) refreshIcon.classList.add('loading-spinner');
    
    refreshData().finally(() => {
        if (refreshIcon) refreshIcon.classList.remove('loading-spinner');
    });
}

// Main refresh function
async function refreshData() {
    console.log('[refreshData] Starting refresh...');
    
    try {
        const response = await fetch(`/api/admin/stats-readonly?apikey=${adminKey}`);
        console.log('[refreshData] Fetch response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const data = await response.json();
        console.log('[refreshData] Response data:', data);
        
        if (!data.success) {
            throw new Error('Invalid response');
        }

        // Buscar configurações de manutenção
        const endpointsRes = await fetch(`/api/admin/endpoints?apikey=${adminKey}`);
        const endpointsData = await endpointsRes.json();
        if (endpointsData.success) {
            data.endpointsConfig = endpointsData.config;
        }

        // Check if data changed
        const newData = JSON.stringify(data);
        if (lastData === newData) {
            console.log('[refreshData] Data unchanged, skipping update');
            return;
        }
        lastData = newData;
        
        console.log('[refreshData] Data changed, updating UI...');
        updateStats(data);
        
        // Sempre atualizar dados essenciais
        updateKeys(data.keys);
        updateEndpoints(data.endpointHits, data.endpointsConfig);
        
        // Se houver logs na resposta, atualizar (precisamos garantir que a API envie logs)
        if (data.logs) {
            updateLogs(data.logs);
        }
        
        console.log('[refreshData] Refresh completed successfully');

    } catch (error) {
        console.error('[refreshData] Error:', error);
        showToast('error', 'Refresh error: ' + error.message);
    }
}

// Update stats
function updateStats(data) {
    console.log('[updateStats] Updating stats...');
    
    const currentTotal = data.totalRequests || 0;
    
    // Calculate rate
    const uptime = data.uptime || 0;
    const rate = uptime > 0 ? (currentTotal / (uptime / 1000)).toFixed(2) : '0';
    
    const statTotal = safeGetElement('stat-total');
    if (statTotal) {
        statTotal.textContent = currentTotal.toLocaleString();
    } else {
        console.error('[updateStats] stat-total element not found!');
    }
    
    const statRate = safeGetElement('stat-rate');
    if (statRate) {
        statRate.textContent = rate;
    }

    const activeKeys = Object.values(data.keys).filter(k => k.active !== false).length;
    const statKeys = safeGetElement('stat-keys');
    if (statKeys) {
        statKeys.textContent = activeKeys;
    }
    
    const statTotalKeys = safeGetElement('stat-total-keys');
    if (statTotalKeys) {
        statTotalKeys.textContent = Object.keys(data.keys).length;
    }

    const totalHits = Object.values(data.endpointHits).reduce((sum, val) => sum + val, 0);
    const statEndpoints = safeGetElement('stat-endpoints');
    if (statEndpoints) {
        statEndpoints.textContent = totalHits.toLocaleString();
    }
    
    const statTypes = safeGetElement('stat-types');
    if (statTypes) {
        statTypes.textContent = Object.keys(data.endpointHits).length;
    }

    // Update uptime - FIX PARA NaN
    const statUptime = safeGetElement('stat-uptime');
    if (statUptime) {
        if (data.startTime && !isNaN(data.startTime)) {
            const uptimeSeconds = Math.floor((Date.now() - data.startTime) / 1000);
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = uptimeSeconds % 60;
            const formatted = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
            
            statUptime.textContent = formatted;
            console.log('[updateStats] Uptime updated to:', formatted);
        } else {
            statUptime.textContent = '0s';
            console.log('[updateStats] Uptime not available, setting to 0s');
        }
    }

    // Update timeline
    updateTimeline(currentTotal);
}

// Update timeline chart
let lastTotalRequests = 0;
function updateTimeline(totalRequests) {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Calcular a diferença (requisições desde a última atualização)
    const diff = lastTotalRequests === 0 ? 0 : totalRequests - lastTotalRequests;
    lastTotalRequests = totalRequests;

    requestHistory.push({ time: timeLabel, requests: diff });
    
    if (requestHistory.length > 20) {
        requestHistory.shift();
    }

    if (timelineChart) {
        timelineChart.data.labels = requestHistory.map(h => h.time);
        timelineChart.data.datasets[0].data = requestHistory.map(h => h.requests);
        timelineChart.update('none');
        console.log('[updateTimeline] Timeline updated with', requestHistory.length, 'points');
    }
}

// Update keys
function updateKeys(keys) {
    console.log('[updateKeys] Updating keys...');
    
    const container = safeGetElement('keys-list');
    if (!container) {
        console.error('[updateKeys] keys-list element not found!');
        return;
    }
    
    const keysArray = Object.entries(keys);

    if (keysArray.length === 0) {
        safeSetInnerHTML('keys-list', `
            <div class="flex items-center justify-center col-span-2" style="padding: 48px;">
                <i class="fas fa-key" style="font-size: 48px; color: #64748b; margin-bottom: 16px;"></i>
                <p class="text-muted" style="font-size: 16px; margin: 0;">Nenhuma API key encontrada</p>
            </div>
        `);
        return;
    }

    container.innerHTML = keysArray.map(([key, info]) => {
        const isActive = info.active !== false;
        const isExpired = info.expiresAt && new Date() > new Date(info.expiresAt);
        const isAdminKey = key === 'MutanoX3397';
        
        return `
            <div class="cyber-card" style="padding: 20px; border: 1px solid ${!isActive || isExpired ? 'rgba(239, 68, 68, 0.3)' : 'rgba(51, 65, 85, 0.3)'}; background: ${!isActive || isExpired ? 'rgba(239, 68, 68, 0.02)' : 'rgba(30, 41, 59, 0.4)'};">
                <div class="flex justify-between items-start" style="margin-bottom: 16px;">
                    <div class="flex items-center gap-3">
                        <div style="width: 44px; height: 44px; background: ${info.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${info.role === 'admin' ? 'fa-shield-alt' : 'fa-key'}" style="font-size: 18px; color: ${info.role === 'admin' ? '#ef4444' : '#10b981'};"></i>
                        </div>
                        <div>
                            <p class="font-bold" style="font-size: 16px; margin: 0; color: #f8fafc;">${info.owner}</p>
                            <div class="flex items-center gap-2" style="margin-top: 4px;">
                                <span class="badge" style="background: ${info.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'}; color: ${info.role === 'admin' ? '#ef4444' : '#6366f1'};">${info.role.toUpperCase()}</span>
                                <span class="badge" style="background: ${!isActive || isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${!isActive || isExpired ? '#ef4444' : '#10b981'};">
                                    ${isExpired ? 'EXPIRADA' : (isActive ? 'ATIVA' : 'INATIVA')}
                                </span>
                            </div>
                        </div>
                    </div>
                    ${!isAdminKey ? `
                    <div class="flex gap-2">
                        <button onclick="window.toggleKeyStatus('${key}')" class="copy-btn" style="padding: 6px 10px; background: ${isActive ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${isActive ? '#f59e0b' : '#10b981'};" title="${isActive ? 'Desativar' : 'Ativar'}">
                            <i class="fas ${isActive ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button onclick="window.deleteKey('${key}')" class="copy-btn" style="padding: 6px 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444;" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>
                
                <div style="margin-bottom: 16px;">
                    <div class="cyber-card" style="padding: 12px; background: rgba(15, 23, 42, 0.3); display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(51, 65, 85, 0.2);">
                        <code class="text-success" style="font-size: 12px; font-family: 'JetBrains Mono', monospace;" id="key-${key.substring(0, 8)}">••••••••••••••••</code>
                        <button onclick="window.toggleKeyVisibility('${key}', 'key-${key.substring(0, 8)}')" class="copy-btn" style="padding: 4px 8px; font-size: 10px;">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4" style="font-size: 13px;">
                    <div class="p-3 rounded-xl" style="background: rgba(15, 23, 42, 0.3);">
                        <p class="text-xs text-muted mb-1">Uso Total</p>
                        <p class="font-bold" style="font-family: 'JetBrains Mono', monospace; font-size: 16px; margin: 0;">${info.usageCount || 0}</p>
                    </div>
                    <div class="p-3 rounded-xl" style="background: rgba(15, 23, 42, 0.3);">
                        <p class="text-xs text-muted mb-1">Duração</p>
                        <p class="font-bold" style="font-family: 'JetBrains Mono', monospace; font-size: 14px; margin: 0;">${info.duration ? (info.duration === '1w' ? '1 Semana' : '1 Mês') : 'Ilimitada'}</p>
                    </div>
                    <div class="col-span-2 p-3 rounded-xl" style="background: rgba(15, 23, 42, 0.3);">
                        <p class="text-xs text-muted mb-1">Expiração</p>
                        <p class="font-bold" style="font-family: 'JetBrains Mono', monospace; font-size: 12px; margin: 0; color: ${isExpired ? '#ef4444' : '#94a3b8'};">
                            ${info.expiresAt ? new Date(info.expiresAt).toLocaleString('pt-BR') : (info.duration ? 'Ativa no 1º uso' : 'Nunca')}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update endpoints
function updateEndpoints(endpointHits, endpointsConfigData = {}) {
    console.log('[updateEndpoints] Updating endpoints...', endpointHits);
    
    const container = document.getElementById('endpoints-management');
    const list = document.getElementById('endpoint-list');
    const endpoints = Object.keys(endpointConfigs);

    // Atualizar Gráfico de Pizza
    if (endpointChart) {
        const labels = Object.keys(endpointHits).length > 0 
            ? Object.keys(endpointHits).map(key => endpointConfigs[key] ? endpointConfigs[key].name : key)
            : ['Nenhum dado'];
        const data = Object.keys(endpointHits).length > 0 
            ? Object.values(endpointHits)
            : [1];
        
        endpointChart.data.labels = labels;
        endpointChart.data.datasets[0].data = data;
        endpointChart.update();
    }

    if (!container) return;

    let activeCount = 0;
    let maintenanceCount = 0;

    container.innerHTML = endpoints.map(endpoint => {
        const config = endpointConfigs[endpoint];
        const hits = endpointHits[endpoint] || 0;
        const totalHits = Object.values(endpointHits).reduce((sum, val) => sum + val, 0);
        const percentage = totalHits > 0 ? ((hits / totalHits) * 100).toFixed(1) : 0;
        const isMaintenance = endpointsConfigData[endpoint] ? endpointsConfigData[endpoint].maintenance : false;

        if (isMaintenance) maintenanceCount++;
        else activeCount++;

        return `
            <div class="endpoint-item cyber-card" style="padding: 20px; border: 1px solid ${isMaintenance ? 'rgba(239, 68, 68, 0.3)' : 'rgba(51, 65, 85, 0.3)'}; background: ${isMaintenance ? 'rgba(239, 68, 68, 0.02)' : 'rgba(30, 41, 59, 0.4)'};">
                <div class="flex items-center justify-between mb-4">
                    <div style="width: 56px; height: 56px; background: ${config.color}1a; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${config.icon}" style="font-size: 24px; color: ${config.color};"></i>
                    </div>
                    <div class="text-right">
                        <span class="badge" style="background: ${isMaintenance ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${isMaintenance ? '#ef4444' : '#10b981'}; border: 1px solid ${isMaintenance ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'};">
                            ${isMaintenance ? 'MANUTENÇÃO' : 'ONLINE'}
                        </span>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h3 class="text-lg font-bold mb-1" style="color: #f8fafc;">${config.name}</h3>
                    <p class="text-muted text-xs" style="line-height: 1.4;">${config.description}</p>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="p-3 rounded-xl" style="background: rgba(15, 23, 42, 0.3);">
                        <p class="text-xs text-muted mb-1">Total Hits</p>
                        <p class="text-xl font-bold" style="font-family: 'JetBrains Mono', monospace;">${hits.toLocaleString()}</p>
                    </div>
                    <div class="p-3 rounded-xl" style="background: rgba(15, 23, 42, 0.3);">
                        <p class="text-xs text-muted mb-1">Share</p>
                        <p class="text-xl font-bold" style="font-family: 'JetBrains Mono', monospace;">${percentage}%</p>
                    </div>
                </div>

                <div class="progress-bar mb-4" style="height: 6px;">
                    <div class="progress-fill" style="width: ${percentage}%; background: ${config.color};"></div>
                </div>

                <div class="flex gap-2">
                    <button onclick="window.toggleMaintenance('${endpoint}')" class="btn-primary" style="flex: 1; padding: 10px; font-size: 12px; background: ${isMaintenance ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};">
                        <i class="fas ${isMaintenance ? 'fa-play' : 'fa-pause'} mr-2"></i>
                        ${isMaintenance ? 'Ativar Serviço' : 'Pausar Serviço'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Atualizar contadores
    const activeEl = document.getElementById('active-endpoints-count');
    const maintenanceEl = document.getElementById('maintenance-endpoints-count');
    if (activeEl) activeEl.textContent = activeCount;
    if (maintenanceEl) maintenanceEl.textContent = maintenanceCount;

    if (list) {
        list.innerHTML = Object.entries(endpointHits).map(([endpoint, hits]) => {
            const config = endpointConfigs[endpoint];
            const totalHits = Object.values(endpointHits).reduce((sum, val) => sum + val, 0);
            const percentage = totalHits > 0 ? ((hits / totalHits) * 100).toFixed(1) : 0;

            return `
                <div class="cyber-card" style="padding: 12px; border-radius: 16px; margin-bottom: 12px; border: 1px solid rgba(51, 65, 85, 0.3);">
                    <div class="flex items-center gap-2" style="margin-bottom: 8px;">
                        <div style="width: 32px; height: 32px; background: ${config.color}1a; border-radius: 8px;">
                            <i class="fas ${config.icon}" style="font-size: 14px; color: ${config.color}; line-height: 32px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <p class="font-bold" style="font-size: 14px; margin: 0;">${config.name}</p>
                            <p class="text-muted" style="font-size: 12px;">${hits} requests (${percentage}%)</p>
                        </div>
                        <div class="progress-bar" style="width: 96px; height: 4px;">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Update chart type
window.updateChartType = function() {
    const newTypeEl = safeGetElement('chart-type');
    if (!newTypeEl) {
        console.error('[updateChartType] chart-type element not found!');
        return;
    }
    
    const newType = newTypeEl.value;
    console.log('[updateChartType] Changing chart type from', currentChartType, 'to', newType);
    
    if (newType !== currentChartType) {
        currentChartType = newType;
        destroyCharts();
        initCharts();
        refreshData();
    }
}

// Toast notification
function showToast(type, message) {
    const container = safeGetElement('toast-container');
    if (!container) {
        console.error('[showToast] toast-container element not found!');
        return;
    }
    
    const colors = {
        success: 'toast-success',
        error: 'toast-error',
        info: 'toast-info',
        warning: 'toast-warning'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${colors[type]}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}" style="font-size: 18px; margin-right: 12px;"></i>
        <span style="font-weight: 600;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Modal functions
window.openCreateModal = function() {
    const modal = safeGetElement('create-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

window.closeCreateModal = function() {
    const modal = safeGetElement('create-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    
    const newOwner = safeGetElement('new-owner');
    const newDescription = safeGetElement('new-description');
    if (newOwner) newOwner.value = '';
    if (newDescription) newDescription.value = '';
}

// Create key function
window.createKey = async function() {
    const newOwner = safeGetElement('new-owner');
    const newRole = safeGetElement('new-role');
    const newDuration = safeGetElement('new-duration');
    const bulkCount = safeGetElement('bulk-count');

    if (!newOwner || !newOwner.value) {
        showToast('error', 'Por favor, insira o nome do dono');
        return;
    }

    const owner = newOwner.value;
    const role = newRole ? newRole.value : 'user';
    const duration = newDuration ? newDuration.value : '';
    const count = bulkCount ? parseInt(bulkCount.value) : 1;

    try {
        let url = '';
        if (count > 1) {
            url = `/api/admin/keys/bulk?owner=${encodeURIComponent(owner)}&count=${count}&duration=${duration}&apikey=${adminKey}`;
        } else {
            url = `/api/admin/keys?owner=${encodeURIComponent(owner)}&role=${role}&duration=${duration}&apikey=${adminKey}`;
        }

        const response = await fetch(url, { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            showToast('success', count > 1 ? `${count} chaves criadas com sucesso` : 'API Key criada com sucesso');
            closeCreateModal();
            refreshData();
        } else {
            showToast('error', 'Erro: ' + data.error);
        }
    } catch (error) {
        showToast('error', 'Erro de conexão: ' + error.message);
    }
}

// Clear logs
window.clearLogs = function() {
    const terminal = safeGetElement('terminal');
    if (terminal) {
        terminal.innerHTML = `
            <div style="text-align: center; padding: 48px;">
                <i class="fas fa-check-circle text-success" style="font-size: 48px; color: #10b981; margin-bottom: 16px;"></i>
                <p>Logs limpos com sucesso</p>
            </div>
        `;
    }
    showToast('success', 'Logs limpos');
}

// Export stats
window.exportStats = function() {
    if (!lastData) {
        showToast('error', 'No data to export');
        return;
    }

    const exportData = {
        timestamp: new Date().toISOString(),
        stats: lastData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mutanox-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('success', 'Statistics exported');
}

// Export keys
window.exportAllKeys = async function() {
    try {
        const response = await fetch(`/api/admin/keys?apikey=${adminKey}`);
        const data = await response.json();
        
        if (data.success) {
            const exportData = {
                timestamp: new Date().toISOString(),
                totalKeys: Object.keys(data.keys).length,
                keys: data.keys
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mutanox-keys-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            showToast('success', 'Keys exported successfully');
        }
    } catch (error) {
        console.error('[exportAllKeys] Error:', error);
        showToast('error', 'Error exporting keys: ' + error.message);
    }
}

// Enter key on login
const adminKeyInput = safeGetElement('admin-key-input');
if (adminKeyInput) {
    adminKeyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

// Toggle maintenance mode
window.toggleMaintenance = async function(endpoint) {
    try {
        const response = await fetch(`/api/admin/endpoints/toggle?target=${endpoint}&apikey=${adminKey}`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            showToast('success', `Endpoint ${endpoint} ${data.maintenance ? 'em manutenção' : 'ativado'}`);
            refreshData();
        }
    } catch (error) {
        showToast('error', 'Erro ao alterar manutenção: ' + error.message);
    }
}

// Toggle key status (Active/Inactive)
window.toggleKeyStatus = async function(key) {
    try {
        const response = await fetch(`/api/admin/toggle?target=${key}&apikey=${adminKey}`, { method: 'POST' });
        const data = await response.json();
        if (data.success) {
            showToast('success', `Chave ${data.active ? 'ativada' : 'desativada'} com sucesso`);
            refreshData();
        }
    } catch (error) {
        showToast('error', 'Erro ao alterar status: ' + error.message);
    }
}

// Delete API Key
window.deleteKey = async function(key) {
    if (!confirm('Tem certeza que deseja excluir esta API Key permanentemente?')) return;
    
    try {
        const response = await fetch(`/api/admin/keys?target=${key}&apikey=${adminKey}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            showToast('success', 'API Key excluída com sucesso');
            refreshData();
        }
    } catch (error) {
        showToast('error', 'Erro ao excluir chave: ' + error.message);
    }
}

// Toggle key visibility
window.toggleKeyVisibility = function(fullKey, elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    if (el.innerText === '••••••••••••••••') {
        el.innerText = fullKey;
        setTimeout(() => {
            el.innerText = '••••••••••••••••';
        }, 5000);
    } else {
        el.innerText = '••••••••••••••••';
    }
}

// Update logs
function updateLogs(logs) {
    const terminal = document.getElementById('terminal');
    if (!terminal) return;

    if (!logs || logs.length === 0) {
        if (terminal.innerHTML.includes('fas fa-terminal')) return;
        terminal.innerHTML = `
            <div style="text-align: center; padding: 48px;">
                <i class="fas fa-terminal" style="font-size: 48px; color: #64748b; margin-bottom: 16px;"></i>
                <p>Aguardando logs do sistema...</p>
            </div>
        `;
        return;
    }

    const logHtml = logs.map(log => {
        const type = log.type.toUpperCase();
        let icon = 'fa-info-circle';
        let color = '#3b82f6';
        
        if (type === 'SUCCESS') { icon = 'fa-check-circle'; color = '#10b981'; }
        else if (type === 'ERROR') { icon = 'fa-exclamation-circle'; color = '#ef4444'; }
        else if (type === 'WARN') { icon = 'fa-exclamation-triangle'; color = '#f59e0b'; }
        else if (type === 'AUTH') { icon = 'fa-lock'; color = '#a855f7'; }
        else if (type === 'ADMIN') { icon = 'fa-crown'; color = '#fbbf24'; }
        else if (type === 'REQUEST') { icon = 'fa-globe'; color = '#3b82f6'; }

        return `
            <div class="log-entry" style="border-left: 3px solid ${color}; margin-bottom: 4px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 0 8px 8px 0;">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2">
                        <i class="fas ${icon}" style="color: ${color}; font-size: 12px;"></i>
                        <span style="color: ${color}; font-weight: 700; font-size: 11px; letter-spacing: 0.5px;">${type}</span>
                        <span style="color: #f8fafc; font-size: 12px;">${log.message}</span>
                    </div>
                    <span style="color: #64748b; font-size: 10px; font-family: 'JetBrains Mono', monospace;">${log.timestamp.split(', ')[1] || log.timestamp}</span>
                </div>
                ${log.details ? `<div style="margin-top: 4px; margin-left: 20px; font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px;">${log.details}</div>` : ''}
            </div>
        `;
    }).join('');

    terminal.innerHTML = logHtml;
}
