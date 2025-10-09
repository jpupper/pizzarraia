// Arrays para generar nombres aleatorios
// Animales autóctonos de Sudamérica
const animales = [
    'Jaguar', 'Puma', 'Cóndor', 'Guanaco', 'Vicuña', 'Llama', 'Alpaca',
    'Capibara', 'Carpincho', 'Tapir', 'Oso Hormiguero', 'Tucán', 'Guacamayo',
    'Yacaré', 'Anaconda', 'Ñandú', 'Armadillo', 'Tatú', 'Coatí', 'Aguará Guazú',
    'Yaguareté', 'Ocelote', 'Margay', 'Huemul', 'Pudú', 'Vizcacha', 'Chinchilla',
    'Flamenco Andino', 'Pingüino de Magallanes', 'Nutria Gigante', 'Delfín Rosado',
    'Perezoso', 'Mono Aullador', 'Mono Tití', 'Boa', 'Caimán', 'Tortuga Mata Mata',
    'Guacamayo Azul', 'Colibrí', 'Loro', 'Cacatúa', 'Piraña', 'Cuy'
];

const adjetivos = [
    'Valiente', 'Audaz', 'Veloz', 'Sabio', 'Fuerte', 'Ágil', 'Brillante',
    'Misterioso', 'Salvaje', 'Sereno', 'Feroz', 'Astuto', 'Noble', 'Leal',
    'Curioso', 'Intrépido', 'Radiante', 'Silencioso', 'Poderoso', 'Gentil',
    'Rebelde', 'Pacífico', 'Creativo', 'Ingenioso', 'Elegante', 'Rápido',
    'Tranquilo', 'Explosivo', 'Místico', 'Épico', 'Legendario', 'Cósmico',
    'Eterno', 'Infinito', 'Supremo', 'Divino', 'Celestial', 'Mágico',
    'Heroico', 'Majestuoso', 'Glorioso', 'Invencible', 'Imparable', 'Libre'
];

const colores = [
    'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa',
    'Negro', 'Blanco', 'Gris', 'Dorado', 'Plateado', 'Bronce', 'Turquesa',
    'Coral', 'Índigo', 'Violeta', 'Carmesí', 'Esmeralda', 'Zafiro', 'Rubí',
    'Ámbar', 'Jade', 'Perla', 'Marfil', 'Ébano', 'Celeste', 'Magenta',
    'Cian', 'Lavanda', 'Fucsia', 'Escarlata', 'Cereza', 'Limón'
];

/**
 * Genera un nombre aleatorio combinando un animal, un adjetivo y un color
 * @param {string} seed - Semilla opcional para generar nombres consistentes (ej: socket.id)
 * @returns {string} Nombre generado (ej: "Perro Valiente Verde")
 */
function generarNombreAleatorio(seed = null) {
    let randomIndex;
    
    if (seed) {
        // Si hay semilla, generar índices basados en ella para consistencia
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        
        const animalIndex = Math.abs(hash) % animales.length;
        const adjetivoIndex = Math.abs(hash >> 8) % adjetivos.length;
        const colorIndex = Math.abs(hash >> 16) % colores.length;
        
        return `${animales[animalIndex]} ${adjetivos[adjetivoIndex]} ${colores[colorIndex]}`;
    } else {
        // Sin semilla, usar Math.random() para nombres completamente aleatorios
        const animalAleatorio = animales[Math.floor(Math.random() * animales.length)];
        const adjetivoAleatorio = adjetivos[Math.floor(Math.random() * adjetivos.length)];
        const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
        
        return `${animalAleatorio} ${adjetivoAleatorio} ${colorAleatorio}`;
    }
}

/**
 * Genera un nombre corto aleatorio (solo animal y color)
 * @param {string} seed - Semilla opcional
 * @returns {string} Nombre generado (ej: "Azul Gato")
 */
function generarNombreCorto(seed = null) {
    if (seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(i);
            hash = hash & hash;
        }
        
        const colorIndex = Math.abs(hash) % colores.length;
        const animalIndex = Math.abs(hash >> 8) % animales.length;
        
        return `${colores[colorIndex]} ${animales[animalIndex]}`;
    } else {
        const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
        const animalAleatorio = animales[Math.floor(Math.random() * animales.length)];
        
        return `${colorAleatorio} ${animalAleatorio}`;
    }
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        animales,
        objetos,
        colores,
        generarNombreAleatorio,
        generarNombreCorto
    };
}
