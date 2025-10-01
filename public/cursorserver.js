// ============================================================
// SISTEMA DE GESTIÓN DE CURSORES REMOTOS
// Basado en el sistema PointServer de lidartoweb
// ============================================================

/**
 * Clase que representa un cursor remoto individual
 */
class CursorPoint {
    constructor(_x, _y, _socketId, _isDrawing = false, _brushSize = 20) {
        this.x = _x;
        this.y = _y;
        this.socketId = _socketId; // ID único del socket
        this.isDrawing = _isDrawing;
        this.brushSize = _brushSize;
        this.timestamp = Date.now();
    }
    
    /**
     * Actualizar la posición y estado del cursor
     */
    set(newX, newY, isDrawing, brushSize) {
        this.x = newX;
        this.y = newY;
        this.isDrawing = isDrawing;
        this.brushSize = brushSize;
        this.timestamp = Date.now();
    }
    
    /**
     * Verificar si el cursor está obsoleto (sin actualizaciones recientes)
     */
    isStale(timeout = 5000) {
        return (Date.now() - this.timestamp) > timeout;
    }
}

/**
 * Clase que gestiona todos los cursores remotos
 */
class CursorServer {
    constructor() {
        this.cursors = []; // Array de CursorPoint
        this.CURSOR_TIMEOUT = 5000; // 5 segundos sin actualización = eliminar cursor
    }
    
    /**
     * Obtener todos los cursores activos
     */
    getAllCursors() {
        return this.cursors;
    }
    
    /**
     * Actualizar cursores - eliminar los obsoletos
     */
    update() {
        // Eliminar cursores obsoletos
        for (let i = this.cursors.length - 1; i >= 0; i--) {
            if (this.cursors[i].isStale(this.CURSOR_TIMEOUT)) {
                console.log(`Cursor obsoleto eliminado: ${this.cursors[i].socketId}`);
                this.cursors.splice(i, 1);
            }
        }
    }
    
    /**
     * Dibujar todos los cursores en el buffer especificado
     */
    display(buffer) {
        for (let i = 0; i < this.cursors.length; i++) {
            const cursor = this.cursors[i];
            
            // Estilo diferente si el usuario remoto está dibujando
            if (cursor.isDrawing) {
                // Cursor activo (dibujando)
                buffer.stroke(100, 255, 100); // Verde
                buffer.strokeWeight(2);
                buffer.noFill();
                
                // Círculo pulsante
                const pulseSize = cursor.brushSize + sin(frameCount * 0.2) * 3;
                buffer.ellipse(cursor.x, cursor.y, pulseSize, pulseSize);
                
                // Círculo interno
                buffer.stroke(150, 255, 150, 150);
                buffer.strokeWeight(1);
                buffer.ellipse(cursor.x, cursor.y, cursor.brushSize * 0.5, cursor.brushSize * 0.5);
            } else {
                // Cursor inactivo (solo moviendo)
                buffer.stroke(100, 150, 255, 180); // Azul semitransparente
                buffer.strokeWeight(1.5);
                buffer.noFill();
                
                // Círculo simple
                buffer.ellipse(cursor.x, cursor.y, cursor.brushSize, cursor.brushSize);
            }
            
            // Cruz central
            buffer.stroke(cursor.isDrawing ? color(100, 255, 100) : color(100, 150, 255));
            buffer.strokeWeight(1.5);
            const crossSize = 4;
            buffer.line(cursor.x - crossSize, cursor.y, cursor.x + crossSize, cursor.y);
            buffer.line(cursor.x, cursor.y - crossSize, cursor.x, cursor.y + crossSize);
        }
    }
    
    /**
     * Procesar datos de cursor recibidos por socket
     * Similar a processJSONtouch pero adaptado para cursores
     */
    processCursorData(data) {
        // Verificar si los datos son válidos
        if (!data || !data.socketId) {
            console.error('Datos de cursor inválidos');
            return;
        }
        
        // Convertir coordenadas normalizadas a coordenadas del canvas
        const canvasX = map(data.x, 0, 1, 0, windowWidth);
        const canvasY = map(data.y, 0, 1, 0, windowHeight);
        
        // Buscar si el cursor ya existe
        let cursorIndex = -1;
        for (let i = 0; i < this.cursors.length; i++) {
            if (this.cursors[i].socketId === data.socketId) {
                cursorIndex = i;
                break;
            }
        }
        
        if (cursorIndex !== -1) {
            // Actualizar cursor existente
            this.cursors[cursorIndex].set(
                canvasX,
                canvasY,
                data.isDrawing || false,
                data.brushSize || 20
            );
        } else {
            // Crear nuevo cursor
            this.cursors.push(new CursorPoint(
                canvasX,
                canvasY,
                data.socketId,
                data.isDrawing || false,
                data.brushSize || 20
            ));
            console.log(`Nuevo cursor agregado: ${data.socketId}`);
        }
    }
    
    /**
     * Procesar JSON de TouchDesigner (compatible con lidartoweb)
     * Este método es llamado desde TouchDesigner vía executeJavaScript
     */
    processJSONtouch(_json) {
        // Verificar si el JSON es válido
        if (!_json || !_json.points || !Array.isArray(_json.points)) {
            console.error('JSON inválido o no contiene puntos');
            return;
        }

        // Crear un mapa de los cursores actuales por ID para búsqueda rápida
        const currentCursorsMap = {};
        for (let i = 0; i < this.cursors.length; i++) {
            currentCursorsMap[this.cursors[i].socketId] = i;
        }

        // Crear un conjunto de IDs del nuevo JSON para verificar qué cursores eliminar
        const newCursorIds = new Set();
        _json.points.forEach(point => {
            newCursorIds.add(point.id);
        });

        // Eliminar cursores que ya no existen en el nuevo JSON
        for (let i = this.cursors.length - 1; i >= 0; i--) {
            if (!newCursorIds.has(this.cursors[i].socketId)) {
                this.cursors.splice(i, 1);
            }
        }

        // Actualizar cursores existentes o crear nuevos
        _json.points.forEach(point => {
            const index = currentCursorsMap[point.id];
            
            // Convertir coordenadas normalizadas (0-1) a coordenadas del canvas
            const canvasX = map(point.x, 0, 1, 0, windowWidth);
            const canvasY = map(point.y, 0, 1, 0, windowHeight);
            
            if (index !== undefined) {
                // Actualizar cursor existente
                this.cursors[index].set(
                    canvasX,
                    canvasY,
                    false, // TouchDesigner points no están "dibujando"
                    20 // Tamaño por defecto
                );
            } else {
                // Crear nuevo cursor
                this.cursors.push(new CursorPoint(
                    canvasX,
                    canvasY,
                    point.id, // Usar el ID del punto como socketId
                    false,
                    20
                ));
            }
        });

        console.log(`Procesados ${_json.total_points} puntos de TouchDesigner. Cursores actuales: ${this.cursors.length}`);
    }
    
    /**
     * Procesar múltiples cursores desde un array
     * Útil si en el futuro se envían múltiples cursores en un solo mensaje
     */
    processCursorArray(cursorsData) {
        if (!cursorsData || !Array.isArray(cursorsData)) {
            console.error('Array de cursores inválido');
            return;
        }
        
        // Crear un conjunto de IDs del nuevo array para verificar qué cursores eliminar
        const newCursorIds = new Set();
        cursorsData.forEach(cursor => {
            newCursorIds.add(cursor.socketId);
        });
        
        // Eliminar cursores que ya no existen en el nuevo array
        for (let i = this.cursors.length - 1; i >= 0; i--) {
            if (!newCursorIds.has(this.cursors[i].socketId)) {
                this.cursors.splice(i, 1);
            }
        }
        
        // Procesar cada cursor del array
        cursorsData.forEach(cursorData => {
            this.processCursorData(cursorData);
        });
        
        console.log(`Procesados ${cursorsData.length} cursores. Cursores actuales: ${this.cursors.length}`);
    }
    
    /**
     * Eliminar un cursor específico por socketId
     */
    removeCursor(socketId) {
        for (let i = this.cursors.length - 1; i >= 0; i--) {
            if (this.cursors[i].socketId === socketId) {
                console.log(`Cursor eliminado manualmente: ${socketId}`);
                this.cursors.splice(i, 1);
                return true;
            }
        }
        return false;
    }
    
    /**
     * Limpiar todos los cursores
     */
    clear() {
        this.cursors = [];
        console.log('Todos los cursores eliminados');
    }
    
    /**
     * Obtener información de debug
     */
    getDebugInfo() {
        return {
            totalCursors: this.cursors.length,
            cursors: this.cursors.map(c => ({
                socketId: c.socketId,
                isDrawing: c.isDrawing,
                age: Date.now() - c.timestamp
            }))
        };
    }
}
