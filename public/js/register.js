// Register page JavaScript
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const passwordInput = document.getElementById('password');
const passwordStrengthBar = document.getElementById('passwordStrengthBar');

// Check if already logged in
fetch(`${config.API_URL}/api/check-session`)
    .then(res => res.json())
    .then(data => {
        if (data.authenticated) {
            window.location.href = 'index.html';
        }
    });

// Password strength indicator
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = calculatePasswordStrength(password);
    
    passwordStrengthBar.className = 'password-strength-bar';
    if (strength === 1) {
        passwordStrengthBar.classList.add('strength-weak');
    } else if (strength === 2) {
        passwordStrengthBar.classList.add('strength-medium');
    } else if (strength === 3) {
        passwordStrengthBar.classList.add('strength-strong');
    }
});

function calculatePasswordStrength(password) {
    if (password.length < 6) return 0;
    if (password.length < 8) return 1;
    
    let strength = 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength = 3;
    
    return Math.min(strength, 3);
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    // Validations
    if (!username || !password || !confirmPassword) {
        showError('Por favor completa todos los campos');
        return;
    }

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }

    registerForm.classList.add('loading');

    try {
        const response = await fetch(`${config.API_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError(data.error || 'Error al crear la cuenta');
            registerForm.classList.remove('loading');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Por favor intenta de nuevo.');
        registerForm.classList.remove('loading');
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
