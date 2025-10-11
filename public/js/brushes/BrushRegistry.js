/**
 * Sistema de registro centralizado para todos los brushes
 * Permite registrar, obtener y gestionar brushes de forma dinámica
 */
class BrushRegistry {
    constructor() {
        this.brushes = new Map();
        this.activeBrush = null;
    }

    /**
     * Registra un nuevo brush en el sistema
     * @param {BaseBrush} brush - Instancia del brush a registrar
     */
    register(brush) {
        if (!(brush instanceof BaseBrush)) {
            console.error('El brush debe ser una instancia de BaseBrush');
            return false;
        }

        if (this.brushes.has(brush.getId())) {
            console.warn(`El brush ${brush.getId()} ya está registrado. Se sobrescribirá.`);
        }

        this.brushes.set(brush.getId(), brush);
        console.log(`✓ Brush registrado: ${brush.getName()} (${brush.getId()})`);
        return true;
    }

    /**
     * Obtiene un brush por su ID
     * @param {string} brushId - ID del brush
     * @returns {BaseBrush|null}
     */
    get(brushId) {
        return this.brushes.get(brushId) || null;
    }

    /**
     * Obtiene todos los brushes registrados
     * @returns {Array<BaseBrush>}
     */
    getAll() {
        return Array.from(this.brushes.values());
    }

    /**
     * Obtiene todos los IDs de brushes registrados
     * @returns {Array<string>}
     */
    getAllIds() {
        return Array.from(this.brushes.keys());
    }

    /**
     * Establece el brush activo
     * @param {string} brushId - ID del brush a activar
     * @returns {boolean}
     */
    setActive(brushId) {
        const brush = this.get(brushId);
        if (!brush) {
            console.error(`Brush ${brushId} no encontrado`);
            return false;
        }

        this.activeBrush = brush;
        
        // Actualizar el input hidden
        const brushTypeInput = document.getElementById('brushType');
        if (brushTypeInput) {
            brushTypeInput.value = brushId;
        }

        // Mostrar/ocultar controles específicos
        this.updateControlsVisibility(brushId);

        console.log(`Brush activo: ${brush.getName()}`);
        return true;
    }

    /**
     * Obtiene el brush activo actual
     * @returns {BaseBrush|null}
     */
    getActive() {
        return this.activeBrush;
    }

    /**
     * Renderiza todos los botones de brushes
     * @param {string} containerId - ID del contenedor donde renderizar
     */
    renderButtons(containerId = 'brushButtons') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        let html = '';
        this.brushes.forEach(brush => {
            html += brush.renderButton();
        });

        container.innerHTML = html;

        // Agregar event listeners
        this.attachButtonListeners();
    }

    /**
     * Agrega event listeners a los botones de brushes
     */
    attachButtonListeners() {
        const buttons = document.querySelectorAll('.brush-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const brushId = button.getAttribute('data-brush');
                this.setActive(brushId);

                // Actualizar clases activas
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    /**
     * Renderiza todos los controles de brushes
     * @param {string} containerId - ID del contenedor donde renderizar
     */
    renderControls(containerId = 'brushControls') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        let html = '';
        this.brushes.forEach(brush => {
            const controls = brush.renderControls();
            if (controls) {
                html += `
                    <div id="${brush.getId()}BrushParams" class="brushParams" style="display: none;">
                        ${controls}
                    </div>
                `;
            }
        });

        container.innerHTML = html;
    }

    /**
     * Actualiza la visibilidad de los controles según el brush activo
     * @param {string} activeBrushId - ID del brush activo
     */
    updateControlsVisibility(activeBrushId) {
        // Ocultar todos los controles
        const allControls = document.querySelectorAll('.brushParams');
        allControls.forEach(control => {
            control.style.display = 'none';
        });

        // Mostrar solo los del brush activo
        const activeControls = document.getElementById(`${activeBrushId}BrushParams`);
        if (activeControls) {
            activeControls.style.display = 'block';
        }
    }

    /**
     * Verifica si un brush está registrado
     * @param {string} brushId - ID del brush
     * @returns {boolean}
     */
    has(brushId) {
        return this.brushes.has(brushId);
    }

    /**
     * Elimina un brush del registro
     * @param {string} brushId - ID del brush a eliminar
     * @returns {boolean}
     */
    unregister(brushId) {
        if (!this.brushes.has(brushId)) {
            console.warn(`Brush ${brushId} no está registrado`);
            return false;
        }

        this.brushes.delete(brushId);
        console.log(`Brush ${brushId} eliminado del registro`);
        return true;
    }

    /**
     * Limpia todos los brushes registrados
     */
    clear() {
        this.brushes.clear();
        this.activeBrush = null;
        console.log('Registro de brushes limpiado');
    }
}

// Crear instancia global del registro
if (typeof window !== 'undefined') {
    window.BrushRegistry = BrushRegistry;
    window.brushRegistry = new BrushRegistry();
}
