// Login page JavaScript
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Check if already logged in
fetch(`${config.API_URL}/api/check-session`, {
    headers: config.getAuthHeaders()
})
    .then(res => res.json())
    .then(data => {
        if (data.authenticated) {
            window.location.href = 'index.html';
        }
    });

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!username || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    loginForm.classList.add('loading');

    try {
        const response = await fetch(`${config.API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token to localStorage
            config.saveToken(data.token);
            
            showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showError(data.error || 'Error al iniciar sesión');
            loginForm.classList.remove('loading');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Por favor intenta de nuevo.');
        loginForm.classList.remove('loading');
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
}
