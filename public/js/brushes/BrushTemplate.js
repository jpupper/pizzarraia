/**
 * TEMPLATE PARA CREAR NUEVOS PINCELES
 * 
 * Este archivo sirve como plantilla para crear nuevos tipos de pinceles.
 * Copia este archivo, renómbralo y modifica según tus necesidades.
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo y renómbralo (ej: MyCustomBrush.js)
 * 2. Cambia el nombre de la clase
 * 3. Define los parámetros específicos de tu pincel
 * 4. Implementa las funciones display() y update()
 * 5. Registra tu pincel en brushRegistry.js
 */

class BrushTemplate {
    /**
     * Constructor del pincel
     * @param {Object} params - Parámetros del pincel
     */
    constructor(params = {}) {
        // ============================================================
        // PARÁMETROS DEL PINCEL
        // Define aquí todos los parámetros que tu pincel necesita
        // ============================================================
        
        // Parámetros de posición
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.pmouseX = params.pmouseX || this.x;
        this.pmouseY = params.pmouseY || this.y;
        
        // Parámetros de color
        this.color = params.color || color(255, 255, 255);
        this.alpha = params.alpha || 255;
        
        // Parámetros de tamaño
        this.size = params.size || 20;
        
        // Parámetros específicos del pincel (PERSONALIZA AQUÍ)
        this.customParam1 = params.customParam1 || 10;
        this.customParam2 = params.customParam2 || 5;
        this.customParam3 = params.customParam3 || true;
        
        // Parámetros de caleidoscopio (opcional)
        this.kaleidoSegments = params.kaleidoSegments || 1;
        this.kaleidoCenterX = params.kaleidoCenterX || null;
        this.kaleidoCenterY = params.kaleidoCenterY || null;
        
        // Estado interno del pincel
        this.life = params.life || 255;
        this.maxLife = params.maxLife || 255;
        this.isDead = false;
        
        // Datos adicionales (metadata)
        this.metadata = params.metadata || {};
    }
    
    /**
     * Función para dibujar el pincel en el buffer
     * @param {p5.Graphics} buffer - Buffer donde se dibujará
     */
    display(buffer) {
        // ============================================================
        // IMPLEMENTA AQUÍ LA LÓGICA DE DIBUJO
        // ============================================================
        
        // Ejemplo básico de dibujo
        buffer.push();
        
        // Aplicar color con alpha
        const c = color(this.color);
        c.setAlpha(this.alpha);
        buffer.fill(c);
        buffer.noStroke();
        
        // Si hay caleidoscopio, dibujar en múltiples segmentos
        if (this.kaleidoSegments > 1 && this.kaleidoCenterX !== null) {
            this.drawKaleidoscope(buffer);
        } else {
            // Dibujo simple
            this.drawSingle(buffer);
        }
        
        buffer.pop();
    }
    
    /**
     * Función para dibujar una sola instancia del pincel
     * @param {p5.Graphics} buffer - Buffer donde se dibujará
     */
    drawSingle(buffer) {
        // ============================================================
        // IMPLEMENTA AQUÍ TU LÓGICA DE DIBUJO ESPECÍFICA
        // ============================================================
        
        // Ejemplo: dibujar un círculo
        buffer.ellipse(this.x, this.y, this.size, this.size);
        
        // Ejemplo: dibujar una línea desde la posición anterior
        // buffer.line(this.pmouseX, this.pmouseY, this.x, this.y);
        
        // Ejemplo: dibujar formas personalizadas
        // buffer.beginShape();
        // buffer.vertex(this.x, this.y);
        // buffer.vertex(this.x + this.size, this.y);
        // buffer.vertex(this.x, this.y + this.size);
        // buffer.endShape(CLOSE);
    }
    
    /**
     * Función para dibujar con efecto caleidoscopio
     * @param {p5.Graphics} buffer - Buffer donde se dibujará
     */
    drawKaleidoscope(buffer) {
        const centerX = this.kaleidoCenterX;
        const centerY = this.kaleidoCenterY;
        
        // Calcular distancia y ángulo desde el centro
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Ángulo entre cada segmento
        const angleStep = (Math.PI * 2) / this.kaleidoSegments;
        
        // Dibujar en cada segmento
        for (let i = 0; i < this.kaleidoSegments; i++) {
            const segmentAngle = angleStep * i;
            
            // Calcular nueva posición
            const newX = centerX + Math.cos(angle + segmentAngle) * distance;
            const newY = centerY + Math.sin(angle + segmentAngle) * distance;
            
            // Guardar posición original
            const originalX = this.x;
            const originalY = this.y;
            
            // Dibujar en nueva posición
            this.x = newX;
            this.y = newY;
            this.drawSingle(buffer);
            
            // Restaurar posición
            this.x = originalX;
            this.y = originalY;
        }
    }
    
    /**
     * Función para actualizar el estado del pincel
     * Se llama en cada frame si el pincel es animado
     */
    update() {
        // ============================================================
        // IMPLEMENTA AQUÍ LA LÓGICA DE ACTUALIZACIÓN
        // ============================================================
        
        // Ejemplo: reducir vida del pincel
        this.life -= 1;
        
        // Marcar como muerto si la vida llega a 0
        if (this.life <= 0) {
            this.isDead = true;
        }
        
        // Ejemplo: actualizar posición (para pinceles animados)
        // this.x += this.velocityX;
        // this.y += this.velocityY;
        
        // Ejemplo: actualizar tamaño
        // this.size *= 0.99;
        
        // Ejemplo: actualizar alpha basado en vida
        this.alpha = map(this.life, 0, this.maxLife, 0, 255);
    }
    
    /**
     * Función para verificar si el pincel está muerto
     * @returns {boolean}
     */
    isDone() {
        return this.isDead;
    }
    
    /**
     * Función para obtener los parámetros del pincel
     * Útil para sincronización por sockets
     * @returns {Object}
     */
    getParams() {
        return {
            x: this.x,
            y: this.y,
            pmouseX: this.pmouseX,
            pmouseY: this.pmouseY,
            color: this.color.toString(),
            alpha: this.alpha,
            size: this.size,
            customParam1: this.customParam1,
            customParam2: this.customParam2,
            customParam3: this.customParam3,
            kaleidoSegments: this.kaleidoSegments,
            kaleidoCenterX: this.kaleidoCenterX,
            kaleidoCenterY: this.kaleidoCenterY,
            life: this.life,
            maxLife: this.maxLife,
            metadata: this.metadata
        };
    }
    
    /**
     * Función estática para crear un pincel desde parámetros
     * Útil para recibir datos por sockets
     * @param {Object} params - Parámetros del pincel
     * @returns {BrushTemplate}
     */
    static fromParams(params) {
        return new BrushTemplate(params);
    }
}

// Exportar la clase (si usas módulos ES6)
// export default BrushTemplate;

// O hacerla global
if (typeof window !== 'undefined') {
    window.BrushTemplate = BrushTemplate;
}
