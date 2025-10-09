/**
 * PARTICLE BRUSH - Ejemplo de Pincel Personalizado
 * 
 * Este pincel crea partículas que se mueven y desvanecen con el tiempo.
 * Sirve como ejemplo de cómo crear un pincel animado.
 */

class ParticleBrush {
    constructor(params = {}) {
        // Posición
        this.x = params.x || 0;
        this.y = params.y || 0;
        this.pmouseX = params.pmouseX || this.x;
        this.pmouseY = params.pmouseY || this.y;
        
        // Color
        this.color = params.color || color(255, 255, 255);
        this.alpha = params.alpha || 255;
        
        // Tamaño
        this.size = params.size || 20;
        this.maxSize = params.maxSize || this.size;
        
        // Parámetros específicos del pincel de partículas
        this.velocityX = params.velocityX || random(-2, 2);
        this.velocityY = params.velocityY || random(-2, 2);
        this.gravity = params.gravity || 0.1;
        this.friction = params.friction || 0.98;
        
        // Vida
        this.life = params.life || 255;
        this.maxLife = params.maxLife || 255;
        this.fadeRate = params.fadeRate || 2;
        
        // Caleidoscopio
        this.kaleidoSegments = params.kaleidoSegments || 1;
        this.kaleidoCenterX = params.kaleidoCenterX || null;
        this.kaleidoCenterY = params.kaleidoCenterY || null;
        
        // Estado
        this.isDead = false;
        
        // Forma de la partícula
        this.shape = params.shape || 'circle'; // 'circle', 'square', 'triangle'
    }
    
    display(buffer) {
        buffer.push();
        
        // Aplicar color con alpha basado en vida
        const c = color(this.color);
        const currentAlpha = map(this.life, 0, this.maxLife, 0, this.alpha);
        c.setAlpha(currentAlpha);
        buffer.fill(c);
        buffer.noStroke();
        
        // Dibujar con o sin caleidoscopio
        if (this.kaleidoSegments > 1 && this.kaleidoCenterX !== null) {
            this.drawKaleidoscope(buffer);
        } else {
            this.drawSingle(buffer);
        }
        
        buffer.pop();
    }
    
    drawSingle(buffer) {
        // Tamaño basado en vida
        const currentSize = map(this.life, 0, this.maxLife, 0, this.size);
        
        switch(this.shape) {
            case 'circle':
                buffer.ellipse(this.x, this.y, currentSize, currentSize);
                break;
                
            case 'square':
                buffer.rectMode(CENTER);
                buffer.rect(this.x, this.y, currentSize, currentSize);
                break;
                
            case 'triangle':
                const half = currentSize / 2;
                buffer.triangle(
                    this.x, this.y - half,
                    this.x - half, this.y + half,
                    this.x + half, this.y + half
                );
                break;
        }
    }
    
    drawKaleidoscope(buffer) {
        const centerX = this.kaleidoCenterX;
        const centerY = this.kaleidoCenterY;
        
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        const angleStep = (Math.PI * 2) / this.kaleidoSegments;
        
        for (let i = 0; i < this.kaleidoSegments; i++) {
            const segmentAngle = angleStep * i;
            const newX = centerX + Math.cos(angle + segmentAngle) * distance;
            const newY = centerY + Math.sin(angle + segmentAngle) * distance;
            
            const originalX = this.x;
            const originalY = this.y;
            
            this.x = newX;
            this.y = newY;
            this.drawSingle(buffer);
            
            this.x = originalX;
            this.y = originalY;
        }
    }
    
    update() {
        // Aplicar velocidad
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Aplicar gravedad
        this.velocityY += this.gravity;
        
        // Aplicar fricción
        this.velocityX *= this.friction;
        this.velocityY *= this.friction;
        
        // Reducir vida
        this.life -= this.fadeRate;
        
        // Marcar como muerto
        if (this.life <= 0) {
            this.isDead = true;
        }
    }
    
    isDone() {
        return this.isDead;
    }
    
    getParams() {
        return {
            x: this.x,
            y: this.y,
            pmouseX: this.pmouseX,
            pmouseY: this.pmouseY,
            color: this.color.toString(),
            alpha: this.alpha,
            size: this.size,
            maxSize: this.maxSize,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            gravity: this.gravity,
            friction: this.friction,
            life: this.life,
            maxLife: this.maxLife,
            fadeRate: this.fadeRate,
            kaleidoSegments: this.kaleidoSegments,
            kaleidoCenterX: this.kaleidoCenterX,
            kaleidoCenterY: this.kaleidoCenterY,
            shape: this.shape
        };
    }
    
    static fromParams(params) {
        return new ParticleBrush(params);
    }
}

// Hacer global
if (typeof window !== 'undefined') {
    window.ParticleBrush = ParticleBrush;
    
    // Auto-registrar en el registro de pinceles si existe
    if (window.brushRegistry) {
        window.brushRegistry.register('particle', ParticleBrush, {
            gravity: 0.1,
            friction: 0.98,
            fadeRate: 2,
            shape: 'circle'
        });
    }
}
