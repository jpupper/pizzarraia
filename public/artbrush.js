// artbrush.js - Implementación del pincel artístico con sistema de partículas

/**
 * Clase para una partícula individual del Art Brush
 */
class Particle {
    constructor(x, y, vx, vy, color, size, seed) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.alpha = 255;
        this.life = 255;
        
        // Usar la semilla para generar un valor de decay determinista
        // Multiplicamos por un número primo y tomamos el módulo para generar un valor pseudoaleatorio
        const pseudoRandom = ((seed * 16807) % 2147483647) / 2147483647;
        this.decay = 2 + (pseudoRandom * 3); // Entre 2 y 5
        
        // Guardar la semilla para futuros cálculos deterministas
        this.seed = seed;
    }
    
    // Actualizar posición y vida de la partícula
    update() {
        // Mover la partícula según su velocidad
        this.x += this.vx;
        this.y += this.vy;
        
        // Reducir la vida y la opacidad
        this.life -= this.decay;
        this.alpha = this.life;
    }
    
    // Dibujar la partícula
    draw(buffer) {
        // Configurar color y opacidad
        const particleColor = color(this.color.levels[0], this.color.levels[1], this.color.levels[2]);
        particleColor.setAlpha(this.alpha);
        buffer.fill(particleColor);
        buffer.noStroke();
        
        // Dibujar la partícula como un círculo
        buffer.ellipse(this.x, this.y, this.size, this.size);
    }
    
    // Verificar si la partícula sigue viva
    isAlive() {
        return this.life > 0;
    }
    
    // Obtener los datos de la partícula para sincronización
    getParticleData() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            size: this.size,
            seed: this.seed
        };
    }
}

/**
 * Sistema de partículas para el Art Brush
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.baseSeed = Date.now(); // Semilla base para la generación de partículas
    }
    
    // Generar un valor pseudoaleatorio determinista basado en una semilla
    pseudoRandom(seed) {
        // Algoritmo Linear Congruential Generator (LCG)
        const a = 1664525;
        const c = 1013904223;
        const m = Math.pow(2, 32);
        return ((seed * a + c) % m) / m; // Valor entre 0 y 1
    }
    
    // Añadir nuevas partículas con parámetros específicos (para sincronización)
    addParticlesWithParams(params) {
        // Extraer todos los parámetros necesarios
        const { 
            x, y, pmouseX, pmouseY, count, color, size, baseSeed,
            // Nuevos parámetros para sincronización exacta
            mouseDirection, mouseSpeed, particleParams 
        } = params;
        
        // Si tenemos parámetros exactos para cada partícula, usarlos directamente
        if (particleParams && particleParams.length > 0) {
            for (let i = 0; i < particleParams.length; i++) {
                const p = particleParams[i];
                // Crear la partícula con exactamente los mismos parámetros
                const particle = new Particle(
                    p.x,
                    p.y,
                    p.vx,
                    p.vy,
                    color,
                    p.size,
                    p.seed
                );
                this.particles.push(particle);
            }
            
            // Devolver los mismos parámetros para mantener la consistencia
            return params;
        }
        
        // Si no tenemos parámetros exactos, generarlos de manera determinista
        // Usar la semilla base proporcionada
        const localBaseSeed = baseSeed || this.baseSeed;
        
        // Calcular la dirección del movimiento del mouse si no se proporcionó
        const calculatedMouseDirection = mouseDirection !== undefined ? 
            mouseDirection : atan2(y - pmouseY, x - pmouseX);
        
        // Calcular la velocidad si no se proporcionó
        const calculatedMouseSpeed = mouseSpeed !== undefined ? 
            mouseSpeed : dist(x, y, pmouseX, pmouseY) * 0.2;
        
        // Array para almacenar los parámetros exactos de cada partícula
        const newParticleParams = [];
        
        // Crear nuevas partículas de manera determinista
        for (let i = 0; i < count; i++) {
            // Generar semilla única para esta partícula
            const particleSeed = localBaseSeed + i;
            
            // Usar valores pseudoaleatorios deterministas basados en la semilla
            const offsetX = (this.pseudoRandom(particleSeed) * 2 - 1) * (size/4);
            const offsetY = (this.pseudoRandom(particleSeed + 1) * 2 - 1) * (size/4);
            
            const angleVariation = (this.pseudoRandom(particleSeed + 2) * 2 - 1) * (PI/6);
            const angle = calculatedMouseDirection + angleVariation;
            
            const speedVariation = this.pseudoRandom(particleSeed + 3);
            const speed = max(0.5, calculatedMouseSpeed * (0.5 + speedVariation));
            const vx = cos(angle) * speed;
            const vy = sin(angle) * speed;
            
            const particleSize = 2 + this.pseudoRandom(particleSeed + 4) * (size/3 - 2);
            
            // Posición final de la partícula
            const particleX = x + offsetX;
            const particleY = y + offsetY;
            
            // Guardar los parámetros exactos de esta partícula
            newParticleParams.push({
                x: particleX,
                y: particleY,
                vx: vx,
                vy: vy,
                size: particleSize,
                seed: particleSeed
            });
            
            // Crear y añadir la partícula
            const particle = new Particle(
                particleX,
                particleY,
                vx,
                vy,
                color,
                particleSize,
                particleSeed
            );
            this.particles.push(particle);
        }
        
        // Devolver los parámetros usados para la sincronización, incluyendo los parámetros exactos de cada partícula
        return {
            x, y, pmouseX, pmouseY, count, size, baseSeed: localBaseSeed,
            mouseDirection: calculatedMouseDirection,
            mouseSpeed: calculatedMouseSpeed,
            particleParams: newParticleParams
        };
    }
    
    // Añadir nuevas partículas (método original para compatibilidad)
    addParticles(x, y, pmouseX, pmouseY, count, color, size) {
        // Generar una nueva semilla base para este grupo de partículas
        this.baseSeed = Date.now() + Math.floor(Math.random() * 10000);
        
        // Calcular parámetros adicionales para sincronización exacta
        const mouseDirection = atan2(y - pmouseY, x - pmouseX);
        const mouseSpeed = dist(x, y, pmouseX, pmouseY) * 0.2;
        
        // Usar el método determinista con todos los parámetros necesarios
        return this.addParticlesWithParams({
            x, y, pmouseX, pmouseY, count, color, size, 
            baseSeed: this.baseSeed,
            mouseDirection: mouseDirection,
            mouseSpeed: mouseSpeed
        });
    }
    
    // Actualizar todas las partículas
    update() {
        // Actualizar cada partícula
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            // Eliminar partículas muertas
            if (!this.particles[i].isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Dibujar todas las partículas
    draw(buffer) {
        for (let particle of this.particles) {
            particle.draw(buffer);
        }
    }
    
    // Obtener el número de partículas activas
    getParticleCount() {
        return this.particles.length;
    }
}

// Instancia global del sistema de partículas
let artBrushParticleSystem = new ParticleSystem();

/**
 * Dibuja el pincel artístico usando el sistema de partículas
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} pmouseX - Posición X anterior del mouse
 * @param {number} pmouseY - Posición Y anterior del mouse
 * @param {number} particleCount - Número de partículas a emitir
 * @param {number} size - Tamaño del pincel
 * @param {p5.Color} color - Color del pincel
 * @param {Object} syncParams - Parámetros para sincronización (opcional)
 * @returns {Object} Parámetros usados para la generación de partículas
 */
function drawArtBrush(buffer, x, y, pmouseX, pmouseY, particleCount, size, color, syncParams = null) {
    // Si no hay movimiento significativo, usar una posición ligeramente desplazada
    if (dist(x, y, pmouseX, pmouseY) < 1) {
        pmouseX = x - 1;
        pmouseY = y - 1;
    }
    
    // Si se proporcionan parámetros de sincronización completos, usarlos directamente
    if (syncParams && syncParams.particleParams) {
        // Usar los parámetros exactos para cada partícula
        return artBrushParticleSystem.addParticlesWithParams({
            x, y, pmouseX, pmouseY, count: particleCount, color, size,
            particleParams: syncParams.particleParams
        });
    } 
    // Si solo se proporciona la semilla base, usar los parámetros básicos
    else if (syncParams && syncParams.baseSeed) {
        return artBrushParticleSystem.addParticlesWithParams({
            x, y, pmouseX, pmouseY, count: particleCount, color, size,
            baseSeed: syncParams.baseSeed,
            mouseDirection: syncParams.mouseDirection,
            mouseSpeed: syncParams.mouseSpeed
        });
    } 
    // Si no hay parámetros de sincronización, generar nuevos
    else {
        // Añadir partículas al sistema y devolver los parámetros usados
        return artBrushParticleSystem.addParticles(
            x, y,             // Posición actual
            pmouseX, pmouseY, // Posición anterior
            particleCount,    // Número de partículas
            color,            // Color
            size              // Tamaño
        );
    }
}

/**
 * Actualiza el sistema de partículas del Art Brush
 */
function updateArtBrush() {
    artBrushParticleSystem.update();
}

/**
 * Dibuja todas las partículas del Art Brush
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 */
function drawArtBrushParticles(buffer) {
    artBrushParticleSystem.draw(buffer);
}
