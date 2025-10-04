// artbrush.js - Implementación del pincel artístico con sistema de partículas

/**
 * Clase para una partícula individual del Art Brush
 */
class Particle {
    constructor(x, y, vx, vy, particleColor, size, seed, colorSeed = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.alpha = 255;
        
        // Usar la vida definida por el slider o el valor por defecto
        this.life = window.artBrushParticleLife || 255;
        
        // Usar la semilla para generar un valor de decay determinista
        // Multiplicamos por un número primo y tomamos el módulo para generar un valor pseudoaleatorio
        const pseudoRandom = ((seed * 16807) % 2147483647) / 2147483647;
        this.decay = 2 + (pseudoRandom * 3); // Entre 2 y 5
        
        // Guardar la semilla para futuros cálculos deterministas
        this.seed = seed;
        
        // Asignar una semilla única para el color de esta partícula
        // Si se proporciona un colorSeed, usarlo; de lo contrario, generar uno nuevo
        this.colorSeed = colorSeed !== null ? colorSeed : seed + 10000;
        
        // Algoritmo de color: interpolar entre el color seleccionado y blanco/negro
        const whiteColor = color(255);
        const blackColor = color(0);
        
        // Usar la semilla para determinar si interpolar con blanco o negro
        const useWhite = (this.colorSeed % 2 === 0);
        
        // Calcular factor de interpolación basado en la semilla
        const lerpFactor = sin(this.colorSeed * 0.01) * 0.5 + 0.5;
        
        // Interpolar entre el color seleccionado y blanco/negro
        this.color = useWhite ? 
            lerpColor(particleColor, whiteColor, lerpFactor * 0.7) : 
            lerpColor(particleColor, blackColor, lerpFactor * 0.3);
    }
    
    // Actualizar posición y vida de la partícula
    update() {
        // Obtener el factor de velocidad global o usar el valor por defecto
        const speedFactor = window.artBrushSpeedFactor || 1.0;
        
        // Mover la partícula según su velocidad ajustada por el factor global
        this.x += this.vx * speedFactor;
        this.y += this.vy * speedFactor;
        
        // Reducir la vida y la opacidad
        this.life -= this.decay;
        this.alpha = this.life;
    }
    
    // Dibujar la partícula
    draw(buffer) {
        // Obtener el alpha global o usar el valor actual
        const globalAlpha = window.artBrushAlpha !== undefined ? window.artBrushAlpha : 255;
        
        // Calcular el alpha final como un porcentaje de la vida restante y el alpha global
        const alphaPercentage = this.life / (window.artBrushParticleLife || 255);
        const finalAlpha = alphaPercentage * globalAlpha;
        
        // Configurar color y opacidad
        const particleColor = color(this.color.levels[0], this.color.levels[1], this.color.levels[2]);
        particleColor.setAlpha(finalAlpha);
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
            seed: this.seed,
            colorSeed: this.colorSeed // Incluir la semilla de color para sincronización
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
                    p.seed,
                    p.colorSeed // Usar la semilla de color para sincronización
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
            
            // Distribución radial de partículas
            // Generar un ángulo aleatorio alrededor del punto central (0-2PI)
            const positionAngle = this.pseudoRandom(particleSeed) * Math.PI * 2;
            
            // Generar un radio aleatorio basado en el tamaño del pincel
            const minRadius = 1; // Radio mínimo
            const maxRadius = size / 4; // Radio máximo basado en el tamaño del pincel
            const radius = minRadius + this.pseudoRandom(particleSeed + 1) * (maxRadius - minRadius);
            
            // Convertir de coordenadas polares a cartesianas
            const offsetX = Math.cos(positionAngle) * radius;
            const offsetY = Math.sin(positionAngle) * radius;
            
            // Calcular el ángulo de movimiento con variación
            const angleVariation = (this.pseudoRandom(particleSeed + 2) * 2 - 1) * (PI/6);
            const velocityAngle = calculatedMouseDirection + angleVariation;
            
            // Obtener Speed Force (multiplicador) y Max Speed (límite)
            const speedForce = (window.artBrushSpeedForce !== undefined) ? window.artBrushSpeedForce : 0.5;
            const maxSpeedLimit = (window.artBrushMaxSpeed !== undefined) ? window.artBrushMaxSpeed : 2.0;
            
            // Calcular velocidad con variación aleatoria
            const speedVariation = this.pseudoRandom(particleSeed + 3);
            
            // Aplicar Speed Force como multiplicador
            const baseSpeed = calculatedMouseSpeed * speedForce * (0.5 + speedVariation);
            
            // LIMITAR la velocidad al Max Speed configurado
            const speed = min(baseSpeed, maxSpeedLimit);
            
            const vx = cos(velocityAngle) * speed;
            const vy = sin(velocityAngle) * speed;
            
            // Usar el tamaño máximo definido por el slider o calcular basado en el tamaño del pincel
            const maxParticleSize = window.artBrushParticleMaxSize || (size/3);
            const particleSize = 2 + this.pseudoRandom(particleSeed + 4) * (maxParticleSize - 2);
            
            // Generar una semilla única para el color de esta partícula
            const colorSeed = particleSeed * (i + 1) * 1000;
            
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
                seed: particleSeed,
                colorSeed: colorSeed
            });
            
            // Crear y añadir la partícula
            const particle = new Particle(
                particleX,
                particleY,
                vx,
                vy,
                color,
                particleSize,
                particleSeed,
                colorSeed
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
        
        // Obtener el valor de particleCount del slider o usar el valor proporcionado
        const particleCount = window.particleCount || count || 10;
        
        // Obtener el valor de alpha global
        window.artBrushAlpha = parseInt(document.getElementById('alphaValue').value);
        
        // Usar el método determinista con todos los parámetros necesarios
        return this.addParticlesWithParams({
            x, y, pmouseX, pmouseY, 
            count: particleCount, 
            color, 
            size, 
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
 * Función básica para dibujar el pincel artístico
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
function drawBasicArtBrush(buffer, x, y, pmouseX, pmouseY, particleCount, size, color, syncParams = null) {
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
 * Dibuja el pincel artístico usando el sistema de partículas con posible efecto caleidoscopio
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} pmouseX - Posición X anterior del mouse
 * @param {number} pmouseY - Posición Y anterior del mouse
 * @param {number} particleCount - Número de partículas a emitir
 * @param {number} size - Tamaño del pincel
 * @param {p5.Color} color - Color del pincel
 * @param {Object} syncParams - Parámetros para sincronización (opcional)
 * @param {number} segments - Número de segmentos para el efecto caleidoscopio
 * @returns {Object} Parámetros usados para la generación de partículas
 */
function drawArtBrush(buffer, x, y, pmouseX, pmouseY, particleCount, size, color, syncParams = null, segments = 1) {
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        return drawBasicArtBrush(buffer, x, y, pmouseX, pmouseY, particleCount, size, color, syncParams);
    } else {
        // Con efecto caleidoscopio
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;
        
        // Calcular el ángulo entre cada segmento
        const angleStep = (Math.PI * 2) / segments;
        
        // Calcular la distancia y ángulo desde el centro para ambos puntos
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const dxPrev = pmouseX - centerX;
        const dyPrev = pmouseY - centerY;
        const distancePrev = Math.sqrt(dxPrev * dxPrev + dyPrev * dyPrev);
        const anglePrev = Math.atan2(dyPrev, dyPrev);
        
        // Crear un array para almacenar los parámetros de sincronización de todos los segmentos
        let allSyncParams = [];
        
        // Dibujar en cada segmento
        for (let i = 0; i < segments; i++) {
            const segmentAngle = angleStep * i;
            
            // Calcular nuevas posiciones para ambos puntos
            const newX = centerX + Math.cos(angle + segmentAngle) * distance;
            const newY = centerY + Math.sin(angle + segmentAngle) * distance;
            
            const newPmouseX = centerX + Math.cos(anglePrev + segmentAngle) * distancePrev;
            const newPmouseY = centerY + Math.sin(anglePrev + segmentAngle) * distancePrev;
            
            // Dibujar el pincel artístico en la nueva posición
            const segmentSyncParams = drawBasicArtBrush(
                buffer, 
                newX, newY, 
                newPmouseX, newPmouseY, 
                particleCount, 
                size, 
                color, 
                syncParams
            );
            
            // Guardar los parámetros de sincronización
            if (segmentSyncParams) {
                allSyncParams.push(segmentSyncParams);
            }
        }
        
        // Devolver los parámetros del primer segmento (para sincronización)
        // Incluir el número de segmentos para que se sincronice correctamente
        const syncResult = allSyncParams.length > 0 ? allSyncParams[0] : null;
        if (syncResult) {
            syncResult.kaleidoSegments = segments;
        }
        return syncResult;
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
