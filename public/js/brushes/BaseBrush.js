/**
 * Clase base para todos los brushes
 * Define la estructura y métodos comunes que todos los brushes deben implementar
 */
class BaseBrush {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.icon = config.icon; // SVG path data
        this.title = config.title || config.name;
        this.parameters = config.parameters || {};
        this.supportsKaleidoscope = config.supportsKaleidoscope !== false; // Por defecto true
    }

    /**
     * Obtiene el ID único del brush
     * @returns {string}
     */
    getId() {
        return this.id;
    }

    /**
     * Obtiene el nombre del brush
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Obtiene el SVG icon path del brush
     * @returns {string}
     */
    getIcon() {
        return this.icon;
    }

    /**
     * Obtiene el título para el tooltip
     * @returns {string}
     */
    getTitle() {
        return this.title;
    }

    /**
     * Obtiene los parámetros específicos del brush
     * @returns {Object}
     */
    getParameters() {
        return this.parameters;
    }

    /**
     * Verifica si el brush soporta kaleidoscopio
     * @returns {boolean}
     */
    supportsKaleidoscopeEffect() {
        return this.supportsKaleidoscope;
    }

    /**
     * Renderiza el HTML del botón del brush
     * @returns {string} HTML string
     */
    renderButton() {
        return `
            <button class="brush-btn" data-brush="${this.id}" title="${this.title}">
                <svg viewBox="0 0 24 24">${this.icon}</svg>
            </button>
        `;
    }

    /**
     * Renderiza los controles específicos del brush
     * @returns {string} HTML string de los controles
     */
    renderControls() {
        // Override en cada brush específico
        return '';
    }
    
    /**
     * Renderiza controles compactos para el cursorGUI
     * Retorna un array de objetos con la configuración de cada slider
     * @returns {Array} Array de configuraciones de sliders
     */
    getCursorGUIControls() {
        // Override en cada brush específico
        // Formato: [{ id: 'param1', label: 'Label', min: 0, max: 100, default: 50, step: 1 }]
        return [];
    }
    
    /**
     * Dibuja una representación visual del brush en el cursorGUI
     * @param {p5.Graphics} buffer - Buffer donde dibujar
     * @param {number} x - Posición X central
     * @param {number} y - Posición Y central
     * @param {number} size - Tamaño del preview
     * @param {Object} color - Color actual
     */
    drawCursorGUIPreview(buffer, x, y, size, color) {
        // Override en cada brush específico
        // Por defecto, dibujar un círculo simple
        buffer.push();
        buffer.fill(color);
        buffer.noStroke();
        buffer.ellipse(x, y, size, size);
        buffer.pop();
    }

    /**
     * Función principal de dibujo - DEBE ser implementada por cada brush
     * @param {p5.Graphics} buffer - Buffer donde dibujar
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {Object} params - Parámetros de dibujo (size, color, alpha, etc.)
     */
    draw(buffer, x, y, params) {
        throw new Error(`El método draw() debe ser implementado en ${this.name}`);
    }

    /**
     * Función de actualización/preparación antes de dibujar
     * @param {Object} params - Parámetros actualizados
     */
    update(params) {
        // Override si es necesario
    }

    /**
     * Obtiene los datos que deben ser sincronizados por socket
     * @param {Object} params - Parámetros actuales
     * @returns {Object} Datos para sincronizar
     */
    getSyncData(params) {
        // Override si el brush necesita datos especiales para sincronizar
        return {};
    }

    /**
     * Procesa datos recibidos de otros clientes
     * @param {Object} data - Datos recibidos
     */
    processSyncData(data) {
        // Override si es necesario
    }

    /**
     * Obtiene la metadata del brush para configuración de sesión
     * Usado en profile.js para mostrar los nombres dinámicamente
     * @returns {Object}
     */
    getMetadata() {
        return {
            id: this.id,
            name: this.name,
            title: this.title,
            icon: this.icon,
            supportsKaleidoscope: this.supportsKaleidoscope
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.BaseBrush = BaseBrush;
}
