// Admin panel JavaScript

// Socket.IO connection for real-time analytics
let socket;
let hourlyChart;
let interactionTypeChart;

// Check authentication on load
checkAuth();

// Auto-refresh every 5 seconds
setInterval(() => {
    loadAllData();
}, 5000);

// Initialize Socket.IO for real-time updates
function initSocket() {
    const socketConfig = config.getSocketConfig();
    socket = io(socketConfig.url, socketConfig.options);
    
    socket.on('connect', () => {
        console.log('Socket connected for analytics');
    });
    
    socket.on('analytics_update', (data) => {
        console.log('Analytics update received:', data);
        updateAnalyticsDisplay(data);
    });
    
    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
}

async function checkAuth() {
    try {
        const response = await fetch(`${config.API_URL}/api/check-session`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }
        
        // Load initial data
        loadAllData();
        loadAnalytics();
        initSocket();
        initCharts();
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'login.html';
    }
}

async function loadAllData() {
    await Promise.all([
        loadUsers(),
        loadConnectedUsers(),
        loadSessions()
    ]);
}

async function loadUsers() {
    try {
        const response = await fetch(`${config.API_URL}/api/admin/users`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.users) {
            document.getElementById('totalUsers').textContent = data.users.length;
            renderUsersTable(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadConnectedUsers() {
    try {
        const response = await fetch(`${config.API_URL}/api/admin/connected`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.connected) {
            document.getElementById('connectedUsers').textContent = data.connected.length;
            renderConnectedUsers(data.connected);
        }
    } catch (error) {
        console.error('Error loading connected users:', error);
    }
}

async function loadSessions() {
    try {
        const response = await fetch(`${config.API_URL}/api/admin/sessions`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.sessions) {
            document.getElementById('activeSessions').textContent = data.sessions.length;
            renderSessions(data.sessions);
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function renderUsersTable(users) {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay usuarios registrados</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Fecha de Registro</th>
                    <th>ID</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td><strong>${escapeHtml(user.username)}</strong></td>
                        <td>${new Date(user.createdAt).toLocaleString('es-ES')}</td>
                        <td><code>${user._id}</code></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function renderConnectedUsers(connected) {
    const container = document.getElementById('connectedContainer');
    
    if (connected.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay usuarios conectados</p>';
        return;
    }
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Usuario</th>
                    <th>Sesión</th>
                    <th>Conectado Desde</th>
                    <th>Socket ID</th>
                </tr>
            </thead>
            <tbody>
                ${connected.map(user => `
                    <tr>
                        <td><strong>${escapeHtml(user.username)}</strong></td>
                        <td>Sesión ${user.sessionId}</td>
                        <td>${new Date(user.connectedAt).toLocaleTimeString('es-ES')}</td>
                        <td><code>${user.socketId.substring(0, 8)}...</code></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function renderSessions(sessions) {
    const container = document.getElementById('sessionsContainer');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay sesiones registradas</p>';
        return;
    }
    
    const html = sessions.map(session => {
        const statusBadge = session.isActive 
            ? '<span style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; margin-left: 8px;">🟢 Activa</span>'
            : '<span style="background: #999; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; margin-left: 8px;">⚪ Inactiva</span>';
        
        const visibilityBadge = session.isPublic !== undefined
            ? (session.isPublic 
                ? '<span style="background: #2196F3; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; margin-left: 8px;">🌐 Pública</span>'
                : '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; margin-left: 8px;">🔒 Privada</span>')
            : '';
        
        return `
            <div class="session-card">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <h3 style="margin: 0;">
                        Sesión ${session.sessionId}
                    </h3>
                    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                        ${statusBadge}
                        ${visibilityBadge}
                    </div>
                </div>
                ${session.name ? `<p style="font-weight: 600; margin: 5px 0; font-size: 1.1rem; color: #333;">${escapeHtml(session.name)}</p>` : ''}
                ${session.description ? `<p style="color: #666; font-size: 0.9rem; margin: 5px 0;">${escapeHtml(session.description)}</p>` : ''}
                
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                    ${session.creatorUsername ? `
                        <div class="session-info" style="margin-bottom: 8px;">
                            👤 <strong>Creador:</strong> ${escapeHtml(session.creatorUsername)}
                        </div>
                    ` : ''}
                    <div class="session-info" style="margin-bottom: 8px;">
                        👥 <strong>Usuarios conectados:</strong> ${session.userCount} usuario${session.userCount !== 1 ? 's' : ''}
                    </div>
                    ${session.allowedBrushTypes && session.allowedBrushTypes.length > 0 ? `
                        <div class="session-info" style="margin-bottom: 8px;">
                            🎨 <strong>Herramientas:</strong> ${session.allowedBrushTypes.length} permitida${session.allowedBrushTypes.length !== 1 ? 's' : ''}
                        </div>
                    ` : ''}
                </div>
                
                ${session.users && session.users.length > 0 ? `
                    <div class="session-users" style="margin-top: 15px;">
                        <h4 style="font-size: 0.9rem; margin-bottom: 8px; color: #666;">Usuarios activos ahora:</h4>
                        ${session.users.map(user => `
                            <span class="user-chip">${escapeHtml(user.username)}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function logout() {
    try {
        await fetch(`${config.API_URL}/api/logout`, { 
            method: 'POST',
            headers: config.getAuthHeaders()
        });
        
        config.removeToken();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = 'login.html';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Analytics functions
async function loadAnalytics() {
    try {
        const response = await fetch(`${config.API_URL}/api/analytics/summary`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.today) {
            document.getElementById('todayInteractions').textContent = data.today.totalInteractions || 0;
            document.getElementById('todayClicks').textContent = data.today.totalClicks || 0;
            document.getElementById('todayTouches').textContent = data.today.totalTouches || 0;
            document.getElementById('todayDraws').textContent = data.today.totalDraws || 0;
        }
        
        if (data.hourlyData) {
            updateHourlyChart(data.hourlyData);
            updateInteractionTypeChart(data.today);
        }
        
        // Load users for filter
        await loadUsersForFilter();
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Estado de filtros de usuarios activos
let activeUserFilters = new Set();

async function loadUsersForFilter() {
    try {
        const response = await fetch(`${config.API_URL}/api/admin/users`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        const container = document.getElementById('userFiltersContainer');
        if (data.users && container) {
            container.innerHTML = '';
            
            // Agregar cada usuario como un filtro con ojito
            data.users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'user-filter-item active';
                userItem.dataset.username = user.username;
                
                userItem.innerHTML = `
                    <div class="user-filter-eye">
                        <svg viewBox="0 0 24 24" class="eye-open">
                            <path fill="#667eea" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        </svg>
                        <svg viewBox="0 0 24 24" class="eye-closed" style="display:none;">
                            <path fill="#999" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z" />
                        </svg>
                    </div>
                    <span class="user-filter-name">${user.username}</span>
                `;
                
                // Agregar evento de click
                userItem.addEventListener('click', () => toggleUserFilter(user.username, userItem));
                
                container.appendChild(userItem);
                
                // Inicialmente todos activos
                activeUserFilters.add(user.username);
            });
        }
    } catch (error) {
        console.error('Error loading users for filter:', error);
    }
}

function toggleUserFilter(username, element) {
    if (activeUserFilters.has(username)) {
        // Desactivar
        activeUserFilters.delete(username);
        element.classList.remove('active');
        element.classList.add('inactive');
        element.querySelector('.eye-open').style.display = 'none';
        element.querySelector('.eye-closed').style.display = 'block';
    } else {
        // Activar
        activeUserFilters.add(username);
        element.classList.add('active');
        element.classList.remove('inactive');
        element.querySelector('.eye-open').style.display = 'block';
        element.querySelector('.eye-closed').style.display = 'none';
    }
    
    // Actualizar gráficos
    updateChartTimeRange();
}

function initCharts() {
    // Hourly chart
    const hourlyCtx = document.getElementById('hourlyChart');
    if (hourlyCtx) {
        hourlyChart = new Chart(hourlyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Interacciones',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    // Interaction type chart
    const typeCtx = document.getElementById('interactionTypeChart');
    if (typeCtx) {
        interactionTypeChart = new Chart(typeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Clicks', 'Touches', 'Dibujos'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

function updateHourlyChart(hourlyData) {
    if (!hourlyChart) return;
    
    // Create labels for all 24 hours
    const labels = [];
    const data = [];
    
    for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        const hourData = hourlyData.find(d => d.hour === i);
        data.push(hourData ? hourData.totalInteractions : 0);
    }
    
    hourlyChart.data.labels = labels;
    hourlyChart.data.datasets[0].data = data;
    hourlyChart.update();
}

function updateInteractionTypeChart(todayStats) {
    if (!interactionTypeChart) return;
    
    interactionTypeChart.data.datasets[0].data = [
        todayStats.totalClicks || 0,
        todayStats.totalTouches || 0,
        todayStats.totalDraws || 0
    ];
    interactionTypeChart.update();
}

function updateAnalyticsDisplay(data) {
    // Update real-time stats when socket receives updates
    loadAnalytics();
}

async function updateChartTimeRange() {
    const timeRange = document.getElementById('timeRange').value;
    const customDateRange = document.getElementById('customDateRange');
    
    if (timeRange === 'custom') {
        customDateRange.style.display = 'block';
        return;
    } else {
        customDateRange.style.display = 'none';
    }
    
    let startDate, endDate;
    const today = new Date();
    
    switch(timeRange) {
        case 'today':
            startDate = new Date(today.setHours(0, 0, 0, 0));
            endDate = new Date();
            break;
        case 'yesterday':
            startDate = new Date(today.setDate(today.getDate() - 1));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'week':
            startDate = new Date(today.setDate(today.getDate() - 7));
            endDate = new Date();
            break;
        case 'month':
            startDate = new Date(today.setDate(today.getDate() - 30));
            endDate = new Date();
            break;
    }
    
    await loadAnalyticsForRange(startDate, endDate);
}

async function applyCustomRange() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    if (!startDate || !endDate) {
        toast.warning('Por favor selecciona ambas fechas');
        return;
    }
    
    if (startDate > endDate) {
        toast.warning('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
    }
    
    await loadAnalyticsForRange(startDate, endDate);
}

async function loadAnalyticsForRange(startDate, endDate) {
    try {
        // Si no hay usuarios activos, mostrar todos
        const usersToFetch = activeUserFilters.size > 0 ? Array.from(activeUserFilters) : [];
        
        if (usersToFetch.length === 0) {
            // Cargar todos los usuarios
            let url = `${config.API_URL}/api/analytics/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
            
            const response = await fetch(url, {
                headers: config.getAuthHeaders()
            });
            const data = await response.json();
            
            processAndDisplayData(data.stats);
        } else {
            // Cargar datos para cada usuario activo
            const allUserData = await Promise.all(
                usersToFetch.map(async username => {
                    let url = `${config.API_URL}/api/analytics/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&username=${encodeURIComponent(username)}`;
                    
                    const response = await fetch(url, {
                        headers: config.getAuthHeaders()
                    });
                    const data = await response.json();
                    
                    return {
                        username,
                        stats: data.stats || []
                    };
                })
            );
            
            // Procesar y mostrar datos superpuestos
            processAndDisplayMultiUserData(allUserData);
        }
    } catch (error) {
        console.error('Error loading analytics for range:', error);
    }
}

function processAndDisplayData(stats) {
    if (!stats) return;
    
    // Aggregate data by hour
    const hourlyData = new Array(24).fill(0).map((_, i) => ({
        hour: i,
        totalInteractions: 0,
        clickCount: 0,
        touchCount: 0,
        drawCount: 0
    }));
    
    stats.forEach(stat => {
        const hour = stat.hour;
        hourlyData[hour].totalInteractions += stat.totalInteractions;
        hourlyData[hour].clickCount += stat.clickCount;
        hourlyData[hour].touchCount += stat.touchCount;
        hourlyData[hour].drawCount += stat.drawCount;
    });
    
    updateHourlyChart(hourlyData);
    
    // Calculate totals
    const totals = stats.reduce((acc, stat) => ({
        totalInteractions: acc.totalInteractions + stat.totalInteractions,
        totalClicks: acc.totalClicks + stat.clickCount,
        totalTouches: acc.totalTouches + stat.touchCount,
        totalDraws: acc.totalDraws + stat.drawCount
    }), { totalInteractions: 0, totalClicks: 0, totalTouches: 0, totalDraws: 0 });
    
    updateInteractionTypeChart(totals);
}

function processAndDisplayMultiUserData(allUserData) {
    if (!hourlyChart) return;
    
    // Generar colores para cada usuario
    const colors = [
        '#667eea',
        '#764ba2',
        '#f093fb',
        '#4facfe',
        '#00f2fe',
        '#43e97b',
        '#38f9d7',
        '#fa709a',
        '#fee140'
    ];
    
    // Crear datasets para cada usuario
    const datasets = allUserData.map((userData, index) => {
        const hourlyData = new Array(24).fill(0);
        
        userData.stats.forEach(stat => {
            hourlyData[stat.hour] = stat.totalInteractions;
        });
        
        return {
            label: userData.username,
            data: hourlyData,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            tension: 0.4,
            fill: false
        };
    });
    
    // Actualizar gráfico con múltiples líneas
    const labels = [];
    for (let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
    }
    
    hourlyChart.data.labels = labels;
    hourlyChart.data.datasets = datasets;
    hourlyChart.update();
    
    // Calcular totales combinados para el gráfico de dona
    const combinedTotals = allUserData.reduce((acc, userData) => {
        userData.stats.forEach(stat => {
            acc.totalClicks += stat.clickCount;
            acc.totalTouches += stat.touchCount;
            acc.totalDraws += stat.drawCount;
        });
        return acc;
    }, { totalClicks: 0, totalTouches: 0, totalDraws: 0 });
    
    updateInteractionTypeChart(combinedTotals);
}

// Función original simplificada
async function loadAnalyticsForRangeOld(startDate, endDate) {
    try {
        let url = `${config.API_URL}/api/analytics/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        
        const response = await fetch(url, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.stats) {
            // Aggregate data by hour
            const hourlyData = new Array(24).fill(0).map((_, i) => ({
                hour: i,
                totalInteractions: 0,
                clickCount: 0,
                touchCount: 0,
                drawCount: 0
            }));
            
            data.stats.forEach(stat => {
                const hour = stat.hour;
                hourlyData[hour].totalInteractions += stat.totalInteractions;
                hourlyData[hour].clickCount += stat.clickCount;
                hourlyData[hour].touchCount += stat.touchCount;
                hourlyData[hour].drawCount += stat.drawCount;
            });
            
            updateHourlyChart(hourlyData);
            
            // Calculate totals
            const totals = data.stats.reduce((acc, stat) => ({
                totalInteractions: acc.totalInteractions + stat.totalInteractions,
                totalClicks: acc.totalClicks + stat.clickCount,
                totalTouches: acc.totalTouches + stat.touchCount,
                totalDraws: acc.totalDraws + stat.drawCount
            }), { totalInteractions: 0, totalClicks: 0, totalTouches: 0, totalDraws: 0 });
            
            updateInteractionTypeChart(totals);
        }
    } catch (error) {
        console.error('Error loading analytics for range:', error);
    }
}

async function downloadAnalyticsData() {
    try {
        const timeRange = document.getElementById('timeRange').value;
        
        let startDate, endDate;
        const today = new Date();
        
        // Determine date range
        switch(timeRange) {
            case 'today':
                startDate = new Date(today.setHours(0, 0, 0, 0));
                endDate = new Date();
                break;
            case 'yesterday':
                startDate = new Date(today.setDate(today.getDate() - 1));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(today.setDate(today.getDate() - 7));
                endDate = new Date();
                break;
            case 'month':
                startDate = new Date(today.setDate(today.getDate() - 30));
                endDate = new Date();
                break;
            case 'custom':
                startDate = new Date(document.getElementById('startDate').value);
                endDate = new Date(document.getElementById('endDate').value);
                if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    toast.warning('Por favor selecciona fechas válidas');
                    return;
                }
                break;
            default:
                startDate = new Date(today.setHours(0, 0, 0, 0));
                endDate = new Date();
        }
        
        // Use active user filters
        const usersToDownload = activeUserFilters.size > 0 ? Array.from(activeUserFilters) : [];
        
        // Fetch detailed interaction data
        let url = `${config.API_URL}/api/analytics/interactions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        
        // If specific users are filtered, add them to the query
        if (usersToDownload.length > 0) {
            url += `&usernames=${encodeURIComponent(usersToDownload.join(','))}`;
        }
        
        const response = await fetch(url, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.interactions) {
            // Convert to CSV
            const csv = convertToCSV(data.interactions);
            
            // Download
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const downloadUrl = URL.createObjectURL(blob);
            
            const userLabel = usersToDownload.length > 0 ? usersToDownload.join('_') : 'all';
            const filename = `analytics_${userLabel}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.csv`;
            
            link.setAttribute('href', downloadUrl);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Analytics data downloaded:', filename);
            toast.success('Datos descargados exitosamente');
        } else {
            toast.info('No hay datos disponibles para el rango seleccionado');
        }
    } catch (error) {
        console.error('Error downloading analytics:', error);
        toast.error('Error al descargar los datos: ' + error.message);
    }
}

function convertToCSV(interactions) {
    if (!interactions || interactions.length === 0) {
        return 'No hay datos disponibles';
    }
    
    // Headers
    const headers = ['Fecha/Hora', 'Usuario', 'Sesión', 'Tipo de Interacción', 'Metadata'];
    
    // Rows
    const rows = interactions.map(interaction => {
        const date = new Date(interaction.timestamp).toLocaleString('es-ES');
        const metadata = JSON.stringify(interaction.metadata || {});
        
        return [
            date,
            interaction.username || 'Anónimo',
            interaction.sessionId || '0',
            interaction.interactionType || 'unknown',
            metadata
        ].map(field => `"${field}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
}
