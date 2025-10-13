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
    update(flowfieldForce = null) {
        // Obtener el factor de velocidad global o usar el valor por defecto
        const speedFactor = window.artBrushSpeedFactor || 1.0;
        
        // Aplicar flowfield si está disponible
        if (flowfieldForce) {
            this.vx += flowfieldForce.x;
            this.vy += flowfieldForce.y;
        }
        
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
        
        // Flowfield configuration
        this.flowfield = [];
        this.flowfieldActive = false; // Si el flowfield está activo (sincronizado)
        this.flowfieldCols = 20;
        this.flowfieldRows = 20;
        this.flowfieldResolution = 20;
        this.flowfieldStrength = 0.1;
        this.showFlowfield = false; // Solo para visualización (no sincronizado)
        this.noiseScale = 0.1; // Aumentado para más variación (era 0.01)
        this.noiseZ = 0;
        this.noiseZSpeed = 0.003; // Velocidad de cambio del flowfield
        // Seed fija para sincronizar el flowfield entre clientes
        this.flowfieldSeed = 12345; // Seed compartida por defecto
        this.syncedNoiseZ = false; // Flag para saber si noiseZ está sincronizado
        // No inicializar el flowfield aquí porque noise() no está disponible aún
        // Se inicializará en la primera llamada a update()
        this.flowfieldInitialized = false;
    }
    
    // Inicializar el flowfield
    initFlowfield() {
        // Verificar que noise() esté disponible
        if (typeof noise === 'undefined') {
            console.warn('noise() no está disponible aún, esperando...');
            return;
        }
        
        // Establecer la seed para sincronizar entre clientes
        if (typeof noiseSeed !== 'undefined') {
            noiseSeed(this.flowfieldSeed);
        }
        
        this.flowfield = [];
        for (let y = 0; y < this.flowfieldRows; y++) {
            this.flowfield[y] = [];
            for (let x = 0; x < this.flowfieldCols; x++) {
                const angle = noise(x * this.noiseScale, y * this.noiseScale, this.noiseZ) * Math.PI * 2;
                this.flowfield[y][x] = angle;
            }
        }
        this.flowfieldInitialized = true;
        console.log('Flowfield inicializado con seed:', this.flowfieldSeed);
    }
    
    // Actualizar el flowfield
    updateFlowfield() {
        // Establecer la seed para mantener sincronización
        if (typeof noiseSeed !== 'undefined') {
            noiseSeed(this.flowfieldSeed);
        }
        
        this.noiseZ += this.noiseZSpeed;
        for (let y = 0; y < this.flowfieldRows; y++) {
            for (let x = 0; x < this.flowfieldCols; x++) {
                const angle = noise(x * this.noiseScale, y * this.noiseScale, this.noiseZ) * Math.PI * 4; // Aumentado a PI * 4 para más variación
                this.flowfield[y][x] = angle;
            }
        }
    }
    
    // Obtener la fuerza del flowfield en una posición
    getFlowfieldForce(x, y) {
        const col = Math.floor(x / this.flowfieldResolution);
        const row = Math.floor(y / this.flowfieldResolution);
        
        if (row >= 0 && row < this.flowfieldRows && col >= 0 && col < this.flowfieldCols) {
            const angle = this.flowfield[row][col];
            return {
                x: Math.cos(angle) * this.flowfieldStrength,
                y: Math.sin(angle) * this.flowfieldStrength
            };
        }
        return { x: 0, y: 0 };
    }
    
    // Dibujar el flowfield
    drawFlowfield(buffer) {
        if (!this.showFlowfield) return;
        
        buffer.push();
        buffer.stroke(255, 255, 255, 100);
        buffer.strokeWeight(1);
        
        for (let y = 0; y < this.flowfieldRows; y++) {
            for (let x = 0; x < this.flowfieldCols; x++) {
                const angle = this.flowfield[y][x];
                const posX = x * this.flowfieldResolution + this.flowfieldResolution / 2;
                const posY = y * this.flowfieldResolution + this.flowfieldResolution / 2;
                const length = this.flowfieldResolution * 0.4;
                
                const endX = posX + Math.cos(angle) * length;
                const endY = posY + Math.sin(angle) * length;
                
                buffer.line(posX, posY, endX, endY);
                
                // Dibujar punta de flecha
                const arrowSize = 3;
                const arrowAngle1 = angle + Math.PI * 0.75;
                const arrowAngle2 = angle - Math.PI * 0.75;
                
                buffer.line(endX, endY, endX + Math.cos(arrowAngle1) * arrowSize, endY + Math.sin(arrowAngle1) * arrowSize);
                buffer.line(endX, endY, endX + Math.cos(arrowAngle2) * arrowSize, endY + Math.sin(arrowAngle2) * arrowSize);
            }
        }
        
        buffer.pop();
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
    
    // Sincronizar noiseZ con otros clientes (llamar desde socket)
    syncFlowfield(seed, noiseZ) {
        this.flowfieldSeed = seed;
        this.noiseZ = noiseZ;
        this.syncedNoiseZ = true;
        // Reinicializar el flowfield con la nueva seed
        if (this.flowfieldInitialized) {
            this.initFlowfield();
        }
        console.log('Flowfield sincronizado - Seed:', seed, 'NoiseZ:', noiseZ);
    }
    
    // Actualizar todas las partículas
    update() {
        // Inicializar el flowfield si no está inicializado
        if (!this.flowfieldInitialized) {
            this.initFlowfield();
        }
        
        // Actualizar el flowfield solo si está inicializado
        if (this.flowfieldInitialized) {
            this.updateFlowfield();
        }
        
        // Actualizar cada partícula
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Obtener la fuerza del flowfield en la posición de la partícula (solo si está activo e inicializado)
            const flowfieldForce = (this.flowfieldActive && this.flowfieldInitialized) ? 
                this.getFlowfieldForce(particle.x, particle.y) : null;
            
            // Actualizar la partícula con la fuerza del flowfield
            particle.update(flowfieldForce);
            
            // Eliminar partículas muertas
            if (!particle.isAlive()) {
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

// Instancia global del sistema de partículas (se inicializa de forma lazy)
let artBrushParticleSystem = null;

// Función para obtener o crear la instancia del sistema de partículas
function getParticleSystem() {
    if (!artBrushParticleSystem) {
        artBrushParticleSystem = new ParticleSystem();
    }
    return artBrushParticleSystem;
}

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
        return getParticleSystem().addParticlesWithParams({
            x, y, pmouseX, pmouseY, count: particleCount, color, size,
            particleParams: syncParams.particleParams
        });
    } 
    // Si solo se proporciona la semilla base, usar los parámetros básicos
    else if (syncParams && syncParams.baseSeed) {
        return getParticleSystem().addParticlesWithParams({
            x, y, pmouseX, pmouseY, count: particleCount, color, size,
            baseSeed: syncParams.baseSeed,
            mouseDirection: syncParams.mouseDirection,
            mouseSpeed: syncParams.mouseSpeed
        });
    } 
    // Si no hay parámetros de sincronización, generar nuevos
    else {
        // Añadir partículas al sistema y devolver los parámetros usados
        return getParticleSystem().addParticles(
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
        const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
        
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
        const anglePrev = Math.atan2(dyPrev, dxPrev);
        
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
            
            // Si tenemos syncParams, necesitamos ajustar las coordenadas para cada segmento
            let segmentSpecificSyncParams = null;
            if (syncParams) {
                // Crear una copia de syncParams con las coordenadas ajustadas para este segmento
                segmentSpecificSyncParams = { ...syncParams };
                
                // Si hay particleParams, ajustar las posiciones de cada partícula para este segmento
                if (syncParams.particleParams && syncParams.particleParams.length > 0) {
                    const adjustedParticleParams = [];
                    
                    for (let j = 0; j < syncParams.particleParams.length; j++) {
                        const p = syncParams.particleParams[j];
                        
                        // Calcular la posición de la partícula relativa al centro original
                        const particleDx = p.x - x;
                        const particleDy = p.y - y;
                        const particleDistance = Math.sqrt(particleDx * particleDx + particleDy * particleDy);
                        const particleAngle = Math.atan2(particleDy, particleDx);
                        
                        // Rotar la partícula según el segmento
                        const rotatedParticleX = newX + Math.cos(particleAngle + segmentAngle) * particleDistance;
                        const rotatedParticleY = newY + Math.sin(particleAngle + segmentAngle) * particleDistance;
                        
                        // Rotar también la velocidad
                        const velocityAngle = Math.atan2(p.vy, p.vx);
                        const velocityMagnitude = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                        const rotatedVx = Math.cos(velocityAngle + segmentAngle) * velocityMagnitude;
                        const rotatedVy = Math.sin(velocityAngle + segmentAngle) * velocityMagnitude;
                        
                        adjustedParticleParams.push({
                            x: rotatedParticleX,
                            y: rotatedParticleY,
                            vx: rotatedVx,
                            vy: rotatedVy,
                            size: p.size,
                            seed: p.seed + i * 10000, // Modificar seed para cada segmento
                            colorSeed: p.colorSeed + i * 10000
                        });
                    }
                    
                    segmentSpecificSyncParams.particleParams = adjustedParticleParams;
                }
            }
            
            // Dibujar el pincel artístico en la nueva posición
            const segmentSyncParams = drawBasicArtBrush(
                buffer, 
                newX, newY, 
                newPmouseX, newPmouseY, 
                particleCount, 
                size, 
                color, 
                segmentSpecificSyncParams || syncParams
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
    getParticleSystem().update();
}

/**
 * Dibuja todas las partículas del Art Brush
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 */
function drawArtBrushParticles(buffer) {
    getParticleSystem().draw(buffer);
}

/**
 * Dibuja el flowfield en el GUI buffer
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 */
function drawArtBrushFlowfield(buffer) {
    getParticleSystem().drawFlowfield(buffer);
}

/**
 * Actualiza la configuración del flowfield
 * @param {boolean} sendToOthers - Si es true, envía los cambios a otros clientes
 */
function updateFlowfieldConfig(sendToOthers = true) {
    const colsInput = document.getElementById('flowfieldCols');
    const rowsInput = document.getElementById('flowfieldRows');
    const strengthInput = document.getElementById('flowfieldStrength');
    const speedInput = document.getElementById('flowfieldSpeed');
    const showCheckbox = document.getElementById('showFlowfield');
    
    const system = getParticleSystem();
    
    if (colsInput) {
        const cols = parseInt(colsInput.value);
        system.flowfieldCols = cols;
        system.flowfieldResolution = windowWidth / cols;
        // Actualizar valor mostrado
        const valueSpan = document.getElementById('flowfieldCols-value');
        if (valueSpan) valueSpan.textContent = cols;
    }
    
    if (rowsInput) {
        const rows = parseInt(rowsInput.value);
        system.flowfieldRows = rows;
        if (!colsInput) {
            system.flowfieldResolution = windowHeight / rows;
        }
        // Actualizar valor mostrado
        const valueSpan = document.getElementById('flowfieldRows-value');
        if (valueSpan) valueSpan.textContent = rows;
    }
    
    if (strengthInput) {
        system.flowfieldStrength = parseFloat(strengthInput.value);
        // Actualizar valor mostrado
        const valueSpan = document.getElementById('flowfieldStrength-value');
        if (valueSpan) valueSpan.textContent = parseFloat(strengthInput.value).toFixed(2);
    }
    
    if (speedInput) {
        system.noiseZSpeed = parseFloat(speedInput.value);
        // Actualizar valor mostrado
        const valueSpan = document.getElementById('flowfieldSpeed-value');
        if (valueSpan) valueSpan.textContent = parseFloat(speedInput.value).toFixed(3);
    }
    
    if (showCheckbox) {
        system.showFlowfield = showCheckbox.checked;
    }
    
    // Reinicializar el flowfield con la nueva configuración
    system.initFlowfield();
    
    // Enviar configuración a otros clientes si está habilitado
    if (sendToOthers && typeof sendFlowfieldConfigUpdate === 'function') {
        sendFlowfieldConfigUpdate();
    }
}

/**
 * ArtBrush - Pincel artístico con partículas
 * Sistema de partículas con flowfield opcional
 */
class ArtBrush extends BaseBrush {
    constructor() {
        super({
            id: 'art',
            name: 'Art Brush',
            title: 'Art Brush',
            icon: '<circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/>',
            supportsKaleidoscope: true,
            parameters: {
                particleCount: { min: 1, max: 30, default: 10, step: 1, label: 'Partículas' },
                speedForce: { min: 0.1, max: 2.0, default: 0.5, step: 0.1, label: 'Fuerza' },
                maxSpeed: { min: 0.1, max: 3.0, default: 0.5, step: 0.1, label: 'Velocidad Máx' },
                particleLife: { min: 50, max: 1000, default: 255, step: 10, label: 'Vida' },
                particleMaxSize: { min: 1, max: 20, default: 8, step: 1, label: 'Tamaño' }
            }
        });
    }

    getCursorGUIControls() {
        return [
            { id: 'particleCount', label: 'Partículas', min: 1, max: 30, default: 10, step: 1 },
            { id: 'speedForce', label: 'Speed Force', min: 0.1, max: 2.0, default: 0.5, step: 0.1 },
            { id: 'maxSpeed', label: 'Max Speed', min: 0.1, max: 3.0, default: 0.5, step: 0.1 },
            { id: 'particleLife', label: 'Life', min: 50, max: 1000, default: 255, step: 10 },
            { id: 'particleMaxSize', label: 'Size', min: 1, max: 20, default: 8, step: 1 }
        ];
    }
    
    drawCursorGUIPreview(buffer, x, y, size, color) {
        buffer.push();
        // Dibujar 5 círculos pequeños alrededor
        for (let i = 0; i < 5; i++) {
            const angle = (TWO_PI / 5) * i;
            const px = x + cos(angle) * size * 0.3;
            const py = y + sin(angle) * size * 0.3;
            buffer.fill(color);
            buffer.noStroke();
            buffer.ellipse(px, py, size * 0.15, size * 0.15);
        }
        buffer.pop();
    }
    
    renderControls() {
        return `
            <label>Particle Count: <span id="particleCount-value">10</span></label>
            <input type="range" value="10" id="particleCount" min="1" max="30" step="1" class="jpslider">
            <br>
            <label>Speed Force: <span id="speedForce-value">0.5</span></label>
            <input type="range" value="0.5" id="speedForce" min="0.1" max="2.0" step="0.1" class="jpslider">
            <br>
            <label>Max Speed: <span id="maxSpeed-value">0.5</span></label>
            <input type="range" value="0.5" id="maxSpeed" min="0.1" max="3.0" step="0.1" class="jpslider">
            <br>
            <label>Life: <span id="particleLife-value">255</span></label>
            <input type="range" value="255" id="particleLife" min="50" max="1000" step="10" class="jpslider">
            <br>
            <label>Particle Size: <span id="particleMaxSize-value">8</span></label>
            <input type="range" value="8" id="particleMaxSize" min="1" max="20" step="1" class="jpslider">
            <br>
            <h4 style="margin-top: 15px; margin-bottom: 10px; color: var(--text); font-size: 0.95rem;">Flowfield</h4>
            <label>Activate Flowfield</label>
            <input type="checkbox" id="activateFlowfield" class="jpcheckbox" onchange="toggleFlowfield()">
            <br>
            <div id="flowfieldControls" style="display: none;">
                <label>Show Flowfield</label>
                <input type="checkbox" id="showFlowfield" class="jpcheckbox" onchange="updateFlowfieldConfig(false)">
                <br>
                <label>Flowfield Cols: <span id="flowfieldCols-value">20</span></label>
                <input type="range" value="20" id="flowfieldCols" min="5" max="50" step="1" class="jpslider" oninput="updateFlowfieldConfig()">
                <br>
                <label>Flowfield Rows: <span id="flowfieldRows-value">20</span></label>
                <input type="range" value="20" id="flowfieldRows" min="5" max="50" step="1" class="jpslider" oninput="updateFlowfieldConfig()">
                <br>
                <label>Flowfield Strength: <span id="flowfieldStrength-value">0.1</span></label>
                <input type="range" value="0.1" id="flowfieldStrength" min="0" max="1" step="0.05" class="jpslider" oninput="updateFlowfieldConfig()">
                <br>
                <label>Flowfield Speed: <span id="flowfieldSpeed-value">0.003</span></label>
                <input type="range" value="0.003" id="flowfieldSpeed" min="0" max="0.02" step="0.001" class="jpslider" oninput="updateFlowfieldConfig()">
                <br>
                <button onclick="sendFlowfieldSync()" style="margin-top: 10px; padding: 8px 15px; background: var(--accent); color: var(--bg); border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                    Sincronizar Flowfield
                </button>
                <br>
            </div>
        `;
    }

    draw(buffer, x, y, params) {
        const { pmouseX = pmouseXGlobal, pmouseY = pmouseYGlobal, particleCount = 10, color, kaleidoSegments = 1, syncParams = null } = params;
        
        // Usar la función legacy
        if (typeof drawArtBrush === 'function') {
            return drawArtBrush(buffer, x, y, pmouseX, pmouseY, particleCount, params.size, color, syncParams, kaleidoSegments);
        }
    }

    getSyncData(params) {
        return { particleCount: params.particleCount || 10 };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new ArtBrush());
}
