// Admin panel JavaScript

// Check authentication on load
checkAuth();

// Auto-refresh every 5 seconds
setInterval(() => {
    loadAllData();
}, 5000);

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
        container.innerHTML = '<p class="empty-state">No hay sesiones activas</p>';
        return;
    }
    
    const html = sessions.map(session => `
        <div class="session-card">
            <h3>Sesión ${session.sessionId}</h3>
            <div class="session-info">
                <strong>${session.userCount}</strong> usuario${session.userCount !== 1 ? 's' : ''} conectado${session.userCount !== 1 ? 's' : ''}
            </div>
            <div class="session-users">
                <h4>Usuarios:</h4>
                ${session.users.map(user => `
                    <span class="user-chip">${escapeHtml(user.username)}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
    
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
