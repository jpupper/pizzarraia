/**
 * FillBrush - Herramienta de relleno (bucket fill)
 * Rellena áreas contiguas con un color
 */
class FillBrush extends BaseBrush {
    constructor() {
        super({
            id: 'fill',
            name: 'Fill Brush',
            title: 'Fill/Bucket',
            icon: '<path d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.53 2.85,10.5 3.44,11.09L8.94,16.59C9.23,16.88 9.62,17 10,17C10.38,17 10.77,16.88 11.06,16.59L16.56,11.09C17.15,10.5 17.15,9.53 16.56,8.94Z" fill="currentColor"/>',
            supportsKaleidoscope: false,
            parameters: {
                fillTolerance: { min: 0, max: 50, default: 0, step: 1, label: 'Tolerancia' }
            }
        });
    }

    getCursorGUIControls() {
        return [
            { id: 'fillTolerance', label: 'Tolerancia', min: 0, max: 50, default: 0, step: 1 }
        ];
    }
    
    drawCursorGUIPreview(buffer, x, y, size, color) {
        buffer.push();
        buffer.fill(color);
        buffer.noStroke();
        buffer.rect(x - size * 0.3, y - size * 0.3, size * 0.6, size * 0.6);
        buffer.pop();
    }
    
    renderControls() {
        return `
            <label>Tolerance: <span id="fillTolerance-value">0</span></label>
            <input type="range" value="0" id="fillTolerance" min="0" max="50" step="1" class="jpslider">
            <br>
            <p style="font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 5px;">
                💡 Tolerance: 0 = solo color exacto, mayor = colores similares
            </p>
        `;
    }

    draw(buffer, x, y, params) {
        const { color, fillTolerance = 0 } = params;
        
        // Implementación básica de flood fill
        buffer.loadPixels();
        const targetColor = buffer.get(x, y);
        
        if (this.colorsMatch(targetColor, [red(color), green(color), blue(color), alpha(color)], fillTolerance)) {
            return; // Ya es del color objetivo
        }
        
        const stack = [[x, y]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            const key = `${cx},${cy}`;
            
            if (visited.has(key)) continue;
            if (cx < 0 || cx >= buffer.width || cy < 0 || cy >= buffer.height) continue;
            
            const currentColor = buffer.get(cx, cy);
            if (!this.colorsMatch(currentColor, targetColor, fillTolerance)) continue;
            
            visited.add(key);
            buffer.set(cx, cy, color);
            
            stack.push([cx + 1, cy]);
            stack.push([cx - 1, cy]);
            stack.push([cx, cy + 1]);
            stack.push([cx, cy - 1]);
        }
        
        buffer.updatePixels();
    }

    colorsMatch(c1, c2, tolerance) {
        const r1 = Array.isArray(c1) ? c1[0] : red(c1);
        const g1 = Array.isArray(c1) ? c1[1] : green(c1);
        const b1 = Array.isArray(c1) ? c1[2] : blue(c1);
        
        const r2 = Array.isArray(c2) ? c2[0] : red(c2);
        const g2 = Array.isArray(c2) ? c2[1] : green(c2);
        const b2 = Array.isArray(c2) ? c2[2] : blue(c2);
        
        return Math.abs(r1 - r2) <= tolerance &&
               Math.abs(g1 - g2) <= tolerance &&
               Math.abs(b1 - b2) <= tolerance;
    }

    getSyncData(params) {
        return { fillTolerance: params.fillTolerance || 0 };
    }
}

// Registrar el brush automáticamente
if (typeof window !== 'undefined' && window.brushRegistry) {
    window.brushRegistry.register(new FillBrush());
}
