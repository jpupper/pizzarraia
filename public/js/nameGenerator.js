// Arrays para generar nombres aleatorios
const animales = [
    'Gato', 'Perro', 'León', 'Tigre', 'Águila', 'Lobo', 'Oso', 'Zorro',
    'Panda', 'Koala', 'Delfín', 'Ballena', 'Búho', 'Halcón', 'Cuervo',
    'Serpiente', 'Cocodrilo', 'Tortuga', 'Conejo', 'Ciervo', 'Pingüino',
    'Flamenco', 'Pavo Real', 'Cisne', 'Mariposa', 'Libélula', 'Abeja',
    'Pulpo', 'Tiburón', 'Foca', 'Nutria', 'Mapache', 'Ardilla', 'Camaleón'
];

const objetos = [
    'Estrella', 'Luna', 'Sol', 'Cometa', 'Nube', 'Rayo', 'Cristal',
    'Diamante', 'Espada', 'Escudo', 'Corona', 'Pluma', 'Flecha', 'Martillo',
    'Llave', 'Espejo', 'Reloj', 'Brújula', 'Ancla', 'Faro', 'Campana',
    'Tambor', 'Guitarra', 'Piano', 'Violín', 'Trompeta', 'Libro', 'Pergamino',
    'Pincel', 'Paleta', 'Lienzo', 'Lápiz', 'Pluma', 'Tinta'
];

const colores = [
    'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Morado', 'Rosa',
    'Negro', 'Blanco', 'Gris', 'Dorado', 'Plateado', 'Bronce', 'Turquesa',
    'Coral', 'Índigo', 'Violeta', 'Carmesí', 'Esmeralda', 'Zafiro', 'Rubí',
    'Ámbar', 'Jade', 'Perla', 'Marfil', 'Ébano', 'Celeste', 'Magenta',
    'Cian', 'Lavanda', 'Fucsia', 'Escarlata', 'Cereza', 'Limón'
];

/**
 * Genera un nombre aleatorio combinando un color, un animal y un objeto
 * @param {string} seed - Semilla opcional para generar nombres consistentes (ej: socket.id)
 * @returns {string} Nombre generado (ej: "Azul Gato Estrella")
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
        
        const colorIndex = Math.abs(hash) % colores.length;
        const animalIndex = Math.abs(hash >> 8) % animales.length;
        const objetoIndex = Math.abs(hash >> 16) % objetos.length;
        
        return `${colores[colorIndex]} ${animales[animalIndex]} ${objetos[objetoIndex]}`;
    } else {
        // Sin semilla, usar Math.random() para nombres completamente aleatorios
        const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
        const animalAleatorio = animales[Math.floor(Math.random() * animales.length)];
        const objetoAleatorio = objetos[Math.floor(Math.random() * objetos.length)];
        
        return `${colorAleatorio} ${animalAleatorio} ${objetoAleatorio}`;
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
