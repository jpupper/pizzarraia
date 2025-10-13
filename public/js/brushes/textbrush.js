/**
 * TextBrush - Pincel de texto
 * Dibuja texto en la posición del cursor
 */
class TextBrush extends BaseBrush {
    constructor() {
        super({
            id: 'text',
            name: 'Text Brush',
            title: 'Text Brush',
            icon: '<text x="12" y="18" text-anchor="middle" font-size="16" font-weight="bold" fill="currentColor">A</text>',
            supportsKaleidoscope: true,
            parameters: {
                textContent: { default: 'TEXTO', label: 'Texto' },
                textSize: { min: 10, max: 200, default: 40, step: 5, label: 'Tamaño' },
                textFont: { default: 'Arial', label: 'Fuente' }
            }
        });
    }

    getCursorGUIControls() {
        return [
            { id: 'textSize', label: 'Tamaño', min: 10, max: 100, default: 40, step: 5 }
        ];
    }
    
    drawCursorGUIPreview(buffer, x, y, size, color) {
        buffer.push();
        buffer.fill(color);
        buffer.noStroke();
        buffer.textAlign(CENTER, CENTER);
        buffer.textSize(size * 0.6);
        buffer.text('A', x, y);
        buffer.pop();
    }
    
    renderControls() {
        return `
            <label>Text</label>
            <input type="text" id="textContent" value="TEXTO" class="jpinput" style="width: 90%; padding: 5px; margin-bottom: 5px;">
            <br>
            <label>Font</label>
            <select id="textFont" class="jpselect">
                <option value="Arial">Arial</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Lato">Lato</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Poppins">Poppins</option>
                <option value="Dancing Script">Dancing Script</option>
                <option value="Pacifico">Pacifico</option>
                <option value="Indie Flower">Indie Flower</option>
                <option value="Shadows Into Light">Shadows Into Light</option>
                <option value="Permanent Marker">Permanent Marker</option>
                <option value="Caveat">Caveat</option>
                <option value="Satisfy">Satisfy</option>
                <option value="Quicksand">Quicksand</option>
                <option value="Comfortaa">Comfortaa</option>
                <option value="Josefin Sans">Josefin Sans</option>
            </select>
            <br>
            <label>Text Size: <span id="textSize-value">40</span></label>
            <input type="range" value="40" id="textSize" min="10" max="200" step="5" class="jpslider">
            <br>
        `;
    }

    drawBasicText(buffer, x, y, text, textSize, fontFamily, color) {
        buffer.textFont(fontFamily);
        buffer.textSize(textSize);
        buffer.textAlign(CENTER, CENTER);
        buffer.fill(color);
        buffer.noStroke();
        buffer.text(text, x, y);
    }

    draw(buffer, x, y, params) {
        const { color, kaleidoSegments = 1, textContent = 'TEXTO', textSize = 40, textFont = 'Arial' } = params;
        
        if (kaleidoSegments <= 1) {
            this.drawBasicText(buffer, x, y, textContent, textSize, textFont, color);
        } else {
            const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;
            const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const angleStep = (Math.PI * 2) / kaleidoSegments;
            
            for (let i = 0; i < kaleidoSegments; i++) {
                const segmentAngle = angleStep * i;
                const newX = centerX + Math.cos(angle + segmentAngle) * distance;
                const newY = centerY + Math.sin(angle + segmentAngle) * distance;
                this.drawBasicText(buffer, newX, newY, textContent, textSize, textFont, color);
            }
        }
    }

    getSyncData(params) {
        return {
            textContent: params.textContent || 'TEXTO',
            textSize: params.textSize || 40,
            textFont: params.textFont || 'Arial'
        };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new TextBrush());
}
