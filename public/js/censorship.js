// Sistema de censura para PizarraCollab
// Lista de palabras prohibidas

const palabrasProhibidas = [
    // Palabras ofensivas básicas
    'puto', 'puta', 'mierda', 'carajo', 'coño', 'joder', 'verga',
    'pendejo', 'pendeja', 'idiota', 'imbecil', 'estupido', 'estupida',
    'marica', 'maricon', 'gay', 'homosexual', 'lesbiana',
    'pene', 'vagina', 'culo', 'tetas', 'polla', 'concha',
    'chingar', 'coger', 'follar', 'culear',
    'put0', 'put4', 'p u t o', 'p.u.t.o',
    'mrd', 'mrda', 'ctm', 'hdp', 'hp'    
];

/**
 * Verifica si un texto contiene palabras prohibidas
 * @param {string} texto - El texto a verificar
 * @returns {boolean} - true si contiene palabras prohibidas, false si no
 */
function contienePalabrasProhibidas(texto) {
    if (!texto) return false;
    
    const textoLower = texto.toLowerCase().trim();
    
    // Verificar cada palabra prohibida
    for (const palabra of palabrasProhibidas) {
        // Buscar la palabra completa o como parte de otra palabra
        const regex = new RegExp(palabra, 'i');
        if (regex.test(textoLower)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Censura un texto reemplazando palabras prohibidas con asteriscos
 * @param {string} texto - El texto a censurar
 * @returns {string} - El texto censurado
 */
function censurarTexto(texto) {
    if (!texto) return texto;
    
    let textoCensurado = texto;
    
    for (const palabra of palabrasProhibidas) {
        const regex = new RegExp(palabra, 'gi');
        const reemplazo = '*'.repeat(palabra.length);
        textoCensurado = textoCensurado.replace(regex, reemplazo);
    }
    
    return textoCensurado;
}

/**
 * Valida el texto del pincel de texto en tiempo real
 * @param {HTMLInputElement} input - El input de texto a validar
 */
function validarTextoBrush(input) {
    if (!input) return;
    
    input.addEventListener('input', function() {
        const texto = this.value;
        
        if (contienePalabrasProhibidas(texto)) {
            // Marcar el input como inválido
            this.style.borderColor = '#ff4757';
            this.style.backgroundColor = 'rgba(255, 71, 87, 0.1)';
            
            // Mostrar mensaje de error
            let errorMsg = this.parentElement.querySelector('.censorship-error');
            if (!errorMsg) {
                errorMsg = document.createElement('small');
                errorMsg.className = 'censorship-error';
                errorMsg.style.color = '#ff4757';
                errorMsg.style.display = 'block';
                errorMsg.style.marginTop = '5px';
                errorMsg.textContent = '⚠️ Este texto contiene palabras no permitidas';
                this.parentElement.appendChild(errorMsg);
            }
            errorMsg.style.display = 'block';
            
            // Deshabilitar el uso del texto
            this.dataset.censored = 'true';
        } else {
            // Restaurar estilo normal
            this.style.borderColor = '';
            this.style.backgroundColor = '';
            
            // Ocultar mensaje de error
            const errorMsg = this.parentElement.querySelector('.censorship-error');
            if (errorMsg) {
                errorMsg.style.display = 'none';
            }
            
            // Habilitar el uso del texto
            this.dataset.censored = 'false';
        }
    });
}

/**
 * Verifica si el texto actual está censurado
 * @param {HTMLInputElement} input - El input de texto
 * @returns {boolean} - true si está censurado, false si no
 */
function estaCensurado(input) {
    return input && input.dataset.censored === 'true';
}

// Inicializar la validación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Buscar el input de texto del pincel de texto
    const textoInput = document.getElementById('texto1');
    
    if (textoInput) {
        validarTextoBrush(textoInput);
        console.log('Sistema de censura activado para el pincel de texto');
    }
});

// Exportar funciones para uso global
window.censorship = {
    contienePalabrasProhibidas,
    censurarTexto,
    validarTextoBrush,
    estaCensurado,
    palabrasProhibidas // Para poder agregar más palabras dinámicamente si es necesario
};
