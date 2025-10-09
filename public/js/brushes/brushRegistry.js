/**
 * REGISTRO DE PINCELES
 * 
 * Este archivo mantiene un registro de todos los pinceles disponibles
 * y proporciona funciones para crear instancias de pinceles.
 */

class BrushRegistry {
    constructor() {
        // Registro de pinceles: nombre -> clase
        this.brushes = new Map();
        
        // Registro de parámetros por defecto: nombre -> params
        this.defaultParams = new Map();
        
        // Inicializar con pinceles básicos
        this.init();
    }
    
    /**
     * Inicializar el registro con los pinceles básicos
     */
    init() {
        // Aquí puedes registrar tus pinceles personalizados
        // Ejemplo:
        // this.register('template', BrushTemplate, {
        //     customParam1: 10,
        //     customParam2: 5,
        //     customParam3: true
        // });
    }
    
    /**
     * Registrar un nuevo tipo de pincel
     * @param {string} name - Nombre del pincel
     * @param {class} BrushClass - Clase del pincel
     * @param {Object} defaultParams - Parámetros por defecto
     */
    register(name, BrushClass, defaultParams = {}) {
        this.brushes.set(name, BrushClass);
        this.defaultParams.set(name, defaultParams);
        console.log(`Pincel registrado: ${name}`);
    }
    
    /**
     * Crear una instancia de un pincel
     * @param {string} name - Nombre del pincel
     * @param {Object} params - Parámetros del pincel
     * @returns {Object|null} - Instancia del pincel o null si no existe
     */
    create(name, params = {}) {
        const BrushClass = this.brushes.get(name);
        
        if (!BrushClass) {
            console.error(`Pincel no encontrado: ${name}`);
            return null;
        }
        
        // Combinar parámetros por defecto con los proporcionados
        const defaults = this.defaultParams.get(name) || {};
        const finalParams = { ...defaults, ...params };
        
        return new BrushClass(finalParams);
    }
    
    /**
     * Verificar si un pincel está registrado
     * @param {string} name - Nombre del pincel
     * @returns {boolean}
     */
    has(name) {
        return this.brushes.has(name);
    }
    
    /**
     * Obtener la lista de pinceles registrados
     * @returns {Array<string>}
     */
    list() {
        return Array.from(this.brushes.keys());
    }
    
    /**
     * Obtener los parámetros por defecto de un pincel
     * @param {string} name - Nombre del pincel
     * @returns {Object|null}
     */
    getDefaultParams(name) {
        return this.defaultParams.get(name) || null;
    }
    
    /**
     * Eliminar un pincel del registro
     * @param {string} name - Nombre del pincel
     */
    unregister(name) {
        this.brushes.delete(name);
        this.defaultParams.delete(name);
        console.log(`Pincel eliminado del registro: ${name}`);
    }
}

// Crear instancia global del registro
const brushRegistry = new BrushRegistry();

// Hacer accesible globalmente
if (typeof window !== 'undefined') {
    window.brushRegistry = brushRegistry;
    window.BrushRegistry = BrushRegistry;
}

// Exportar (si usas módulos ES6)
// export default brushRegistry;
// export { BrushRegistry };
