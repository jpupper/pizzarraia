// fillbrush.js - Implementación OPTIMIZADA del pincel de relleno
// Usa Scanline Flood Fill para MUCHO mejor rendimiento en áreas grandes

/**
 * Rellena un área contigua del mismo color (Scanline Flood Fill Algorithm)
 * Este algoritmo es 5-10x más rápido que el pixel-by-pixel tradicional
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del click
 * @param {number} y - Posición Y del click
 * @param {p5.Color} fillColor - Color de relleno
 * @param {number} tolerance - Tolerancia de color (0-255, default: 0)
 */
function drawFillBrush(buffer, x, y, fillColor, tolerance = 0) {
    // Convertir coordenadas a enteros
    x = Math.floor(x);
    y = Math.floor(y);
    
    // Verificar que las coordenadas estén dentro del canvas
    if (x < 0 || x >= buffer.width || y < 0 || y >= buffer.height) {
        return;
    }
    
    // Cargar los píxeles del buffer
    buffer.loadPixels();
    
    // Obtener el color del píxel clickeado (color objetivo)
    const targetColor = getPixelColor(buffer, x, y);
    
    // Obtener el color de relleno en formato [r, g, b, a]
    const fillColorArray = [
        red(fillColor),
        green(fillColor),
        blue(fillColor),
        alpha(fillColor)
    ];
    
    // Si el color objetivo es igual al color de relleno, no hacer nada
    if (colorsMatch(targetColor, fillColorArray, 0)) {
        buffer.updatePixels();
        return;
    }
    
    const startTime = Date.now();
    const maxTime = 15000; // 15 segundos máximo
    
    // Scanline Flood Fill
    const stack = [{x: x, y: y}];
    const width = buffer.width;
    const height = buffer.height;
    let pixelsProcessed = 0;
    
    // Array para marcar líneas ya procesadas (más eficiente que Set para scanline)
    const processed = new Uint8Array(width * height);
    
    while (stack.length > 0) {
        // Verificar timeout cada 100 iteraciones
        if (stack.length % 100 === 0) {
            const elapsed = Date.now() - startTime;
            if (elapsed > maxTime) {
                break;
            }
        }
        
        const point = stack.pop();
        let px = point.x;
        const py = point.y;
        
        // Verificar límites
        if (py < 0 || py >= height) continue;
        
        // Buscar el inicio de la línea (ir hacia la izquierda)
        while (px >= 0 && !processed[py * width + px] && 
               colorsMatch(getPixelColor(buffer, px, py), targetColor, tolerance)) {
            px--;
        }
        px++; // Volver al primer píxel válido
        
        let spanAbove = false;
        let spanBelow = false;
        
        // Rellenar la línea horizontal y buscar líneas arriba/abajo
        while (px < width && !processed[py * width + px] && 
               colorsMatch(getPixelColor(buffer, px, py), targetColor, tolerance)) {
            
            // Marcar como procesado
            processed[py * width + px] = 1;
            
            // Pintar el píxel
            setPixelColor(buffer, px, py, fillColorArray);
            pixelsProcessed++;
            
            // Verificar píxel arriba
            if (py > 0) {
                const above = getPixelColor(buffer, px, py - 1);
                const aboveMatches = colorsMatch(above, targetColor, tolerance);
                const aboveProcessed = processed[(py - 1) * width + px];
                
                if (!spanAbove && aboveMatches && !aboveProcessed) {
                    stack.push({x: px, y: py - 1});
                    spanAbove = true;
                } else if (spanAbove && (!aboveMatches || aboveProcessed)) {
                    spanAbove = false;
                }
            }
            
            // Verificar píxel abajo
            if (py < height - 1) {
                const below = getPixelColor(buffer, px, py + 1);
                const belowMatches = colorsMatch(below, targetColor, tolerance);
                const belowProcessed = processed[(py + 1) * width + px];
                
                if (!spanBelow && belowMatches && !belowProcessed) {
                    stack.push({x: px, y: py + 1});
                    spanBelow = true;
                } else if (spanBelow && (!belowMatches || belowProcessed)) {
                    spanBelow = false;
                }
            }
            
            px++;
        }
    }
    
    // Actualizar los píxeles del buffer
    buffer.updatePixels();
}

/**
 * Obtiene el color de un píxel en formato [r, g, b, a]
 */
function getPixelColor(buffer, x, y) {
    const index = (y * buffer.width + x) * 4;
    return [
        buffer.pixels[index],     // r
        buffer.pixels[index + 1], // g
        buffer.pixels[index + 2], // b
        buffer.pixels[index + 3]  // a
    ];
}

/**
 * Establece el color de un píxel
 */
function setPixelColor(buffer, x, y, color) {
    const index = (y * buffer.width + x) * 4;
    buffer.pixels[index] = color[0];     // r
    buffer.pixels[index + 1] = color[1]; // g
    buffer.pixels[index + 2] = color[2]; // b
    buffer.pixels[index + 3] = color[3]; // a
}

/**
 * Compara dos colores con una tolerancia
 */
function colorsMatch(color1, color2, tolerance) {
    return (
        Math.abs(color1[0] - color2[0]) <= tolerance &&
        Math.abs(color1[1] - color2[1]) <= tolerance &&
        Math.abs(color1[2] - color2[2]) <= tolerance &&
        Math.abs(color1[3] - color2[3]) <= tolerance
    );
}
