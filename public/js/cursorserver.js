// ============================================================
// SISTEMA DE GESTIÓN DE CURSORES REMOTOS
// Basado en el sistema PointServer de lidartoweb
// ============================================================

/**
 * Clase que representa un cursor remoto individual
 */
class CursorPoint {
    constructor(_x, _y, _socketId, _isDrawing = false, _brushSize = 20, _username = '') {
        this.x = _x;
        this.y = _y;
        this.socketId = _socketId; // ID único del socket
        this.isDrawing = _isDrawing;
        this.brushSize = _brushSize;
        this.username = _username; // Nombre del usuario
        this.timestamp = Date.now();
    }
    
    /**
     * Actualizar la posición y estado del cursor
     */
    set(newX, newY, isDrawing, brushSize, username = '') {
        this.x = newX;
        this.y = newY;
        this.isDrawing = isDrawing;
        this.brushSize = brushSize;
        if (username) {
            this.username = username;
        }
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
        this.previousPositions = {}; // Mapa de posiciones anteriores por socketId/pointId
        this.lastCursorCount = 0; // Para evitar spam de logs
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
        // Usar timeout más largo para cursores LIDAR (10 segundos vs 5 segundos)
        for (let i = this.cursors.length - 1; i >= 0; i--) {
            const cursor = this.cursors[i];
            const timeout = cursor.socketId.startsWith('lidar_') ? 10000 : this.CURSOR_TIMEOUT;
            
            if (cursor.isStale(timeout)) {
                console.log(`Cursor obsoleto eliminado: ${cursor.socketId} (timeout: ${timeout}ms)`);
                this.cursors.splice(i, 1);
            }
        }
        
        // Actualizar lista de usuarios conectados
        this.updateConnectedUsersList();
    }
    
    /**
     * Actualizar la lista de usuarios conectados en el chat
     */
    updateConnectedUsersList() {
        const usersList = document.getElementById('connectedUsersList');
        if (!usersList) return;
        
        // Obtener usuarios únicos (sin LIDAR)
        const uniqueUsers = new Map();
        this.cursors.forEach(cursor => {
            if (!cursor.socketId.startsWith('lidar_') && cursor.username) {
                uniqueUsers.set(cursor.socketId, cursor.username);
            }
        });
        
        // Actualizar el HTML
        if (uniqueUsers.size === 0) {
            usersList.innerHTML = '<span style="color: rgba(255,255,255,0.5); font-size: 0.8rem;">No hay usuarios conectados</span>';
        } else {
            usersList.innerHTML = '';
            uniqueUsers.forEach((username, socketId) => {
                const userBadge = document.createElement('span');
                userBadge.style.cssText = 'display: inline-block; padding: 4px 10px; background: rgba(138, 79, 191, 0.4); border-radius: 12px; font-size: 0.75rem; color: white; border: 1px solid rgba(138, 79, 191, 0.6);';
                userBadge.textContent = username;
                usersList.appendChild(userBadge);
            });
        }
    }
    
    /**
     * Dibujar todos los cursores en el buffer especificado
     */
    display(buffer) {
        // Verificar si la recepción de sockets está habilitada
        if (!config.sockets.receiveEnabled) {
            // Si la recepción está desactivada, mostrar 0 cursores
            const cursorCountElement = document.getElementById('cursorCount');
            if (cursorCountElement) {
                cursorCountElement.textContent = `Cursores: 0 (recepción desactivada)`;
            }
            return; // No dibujar cursores
        }
        
        // Actualizar contador en la interfaz
        const cursorCountElement = document.getElementById('cursorCount');
        if (cursorCountElement) {
            cursorCountElement.textContent = `Cursores: ${this.cursors.length}`;
        }
        
        // Debug: verificar si hay cursores LIDAR
        const lidarCursors = this.cursors.filter(c => c.socketId.startsWith('lidar_'));
        if (lidarCursors.length > 0) {
            console.log(`Dibujando ${lidarCursors.length} cursores LIDAR`);
        }
        
        for (let i = 0; i < this.cursors.length; i++) {
            const cursor = this.cursors[i];
            
            // Estilo diferente si el usuario remoto está dibujando
            if (cursor.isDrawing) {
                // Cursor activo (dibujando) - MÁS VISIBLE
                buffer.stroke(100, 255, 100, 255); // Verde brillante
                buffer.strokeWeight(3);
                buffer.noFill();
                
                // Círculo pulsante más grande
                const pulseSize = cursor.brushSize + sin(frameCount * 0.2) * 5;
                buffer.ellipse(cursor.x, cursor.y, pulseSize, pulseSize);
                
                // Círculo interno
                buffer.stroke(150, 255, 150, 200);
                buffer.strokeWeight(2);
                buffer.ellipse(cursor.x, cursor.y, cursor.brushSize * 0.5, cursor.brushSize * 0.5);
            } else {
                // Cursor inactivo (solo moviendo)
                buffer.stroke(100, 150, 255, 180); // Azul semitransparente
                buffer.strokeWeight(1.5);
                buffer.noFill();
                
                // Círculo simple
                buffer.ellipse(cursor.x, cursor.y, cursor.brushSize, cursor.brushSize);
            }
            
            // Cruz central MÁS VISIBLE
            buffer.stroke(cursor.isDrawing ? color(100, 255, 100, 255) : color(100, 150, 255, 180));
            buffer.strokeWeight(2);
            const crossSize = 6;
            buffer.line(cursor.x - crossSize, cursor.y, cursor.x + crossSize, cursor.y);
            buffer.line(cursor.x, cursor.y - crossSize, cursor.x, cursor.y + crossSize);
            
            // Dibujar nombre del usuario
            if (cursor.username) {
                buffer.push();
                
                // Configurar texto
                buffer.textAlign(CENTER, BOTTOM);
                buffer.textSize(14);
                buffer.textFont('Arial');
                
                // Fondo semi-transparente para el texto
                const textWidth = buffer.textWidth(cursor.username);
                const padding = 6;
                const bgX = cursor.x - textWidth / 2 - padding;
                const bgY = cursor.y - cursor.brushSize / 2 - 25;
                const bgWidth = textWidth + padding * 2;
                const bgHeight = 20;
                
                // Dibujar fondo
                buffer.noStroke();
                buffer.fill(0, 0, 0, 150); // Negro semi-transparente
                buffer.rect(bgX, bgY, bgWidth, bgHeight, 4); // Bordes redondeados
                
                // Dibujar texto
                buffer.fill(cursor.isDrawing ? color(100, 255, 100) : color(100, 150, 255));
                buffer.noStroke();
                buffer.text(cursor.username, cursor.x, cursor.y - cursor.brushSize / 2 - 10);
                
                buffer.pop();
            }
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
                data.brushSize || 20,
                data.username || ''
            );
        } else {
            // Crear nuevo cursor
            this.cursors.push(new CursorPoint(
                canvasX,
                canvasY,
                data.socketId,
                data.isDrawing || false,
                data.brushSize || 20,
                data.username || ''
            ));
            console.log(`Nuevo cursor remoto agregado: ${data.socketId} (${data.username || 'Sin nombre'}) en (${canvasX.toFixed(1)}, ${canvasY.toFixed(1)})`);
        }
        
        // Debug: mostrar total de cursores (solo cuando cambia)
        const lidarCount = this.cursors.filter(c => c.socketId.startsWith('lidar_')).length;
        const regularCount = this.cursors.length - lidarCount;
        if (lidarCount > 0 || this.cursors.length !== this.lastCursorCount) {
            console.log(`Cursores totales: ${this.cursors.length} (LIDAR: ${lidarCount}, Regulares: ${regularCount})`);
            this.lastCursorCount = this.cursors.length;
        }
    }
    
    /**
     * Procesar JSON de TouchDesigner (compatible con lidartoweb)
     * Este método es llamado desde TouchDesigner vía executeJavaScript
     */
    processJSONtouch(_json, shouldBroadcast = true) {
        // Verificar si el JSON es válido
        if (!_json || !_json.points || !Array.isArray(_json.points)) {
            console.error('JSON inválido o no contiene puntos');
            return;
        }

        // Obtener configuración actual del pincel
        const brushSize = parseInt(document.getElementById('size').value) || 20;
        const brushType = document.getElementById('brushType').value || 'classic';
        const alphaValue = parseInt(document.getElementById('alphaValue').value) || 100;
        const colorValue = document.getElementById('c1').value;

        // Crear un mapa de los cursores actuales por ID para búsqueda rápida
        const currentCursorsMap = {};
        for (let i = 0; i < this.cursors.length; i++) {
            currentCursorsMap[this.cursors[i].socketId] = i;
        }

        // Crear un conjunto de IDs del nuevo JSON para verificar qué cursores eliminar
        const newCursorIds = new Set();
        _json.points.forEach(point => {
            newCursorIds.add('lidar_' + point.id); // Prefijo para diferenciar de sockets
        });

        // Eliminar cursores que ya no existen en el nuevo JSON (solo los LIDAR)
        for (let i = this.cursors.length - 1; i >= 0; i--) {
            if (this.cursors[i].socketId.startsWith('lidar_') && !newCursorIds.has(this.cursors[i].socketId)) {
                const removedId = this.cursors[i].socketId;
                
                // Si es Line Brush y tenemos un punto inicial, dibujar la línea ahora
                if (brushType === 'line' && this.lineStartPoints && this.lineStartPoints[removedId]) {
                    const startPoint = this.lineStartPoints[removedId];
                    const endPoint = this.previousPositions[removedId];
                    
                    if (endPoint && window.drawBuffer) {
                        const col = color(colorValue);
                        col.setAlpha(alphaValue);
                        
                        // Dibujar la línea localmente
                        drawLineBrush(drawBuffer, endPoint.x, endPoint.y, startPoint.x, startPoint.y, brushSize, col);
                        
                        // Enviar por socket
                        if (shouldBroadcast && window.socket && window.sessionId) {
                            const socketData = {
                                x: map(endPoint.x, 0, windowWidth, 0, 1),
                                y: map(endPoint.y, 0, windowHeight, 0, 1),
                                pmouseX: map(startPoint.x, 0, windowWidth, 0, 1),
                                pmouseY: map(startPoint.y, 0, windowHeight, 0, 1),
                                c1: colorValue,
                                s: brushSize,
                                av: alphaValue,
                                bt: 'line',
                                bc: false,
                                session: sessionId,
                                sourceType: 'lidar',
                                pointId: removedId
                            };
                            if (socket && socket.connected) {
                                socket.emit('mouse', socketData);
                            }
                        }
                        
                        console.log(`Line Brush: Línea dibujada para ${removedId} desde (${startPoint.x}, ${startPoint.y}) hasta (${endPoint.x}, ${endPoint.y})`);
                    }
                    
                    // Limpiar el punto inicial
                    delete this.lineStartPoints[removedId];
                }
                
                this.cursors.splice(i, 1);
                // También eliminar la posición anterior guardada
                delete this.previousPositions[removedId];
            }
        }

        // Procesar cada punto
        _json.points.forEach(point => {
            const pointId = 'lidar_' + point.id;
            const index = currentCursorsMap[pointId];
            
            // Convertir coordenadas normalizadas (0-1) a coordenadas del canvas
            const canvasX = map(point.x, 0, 1, 0, windowWidth);
            const canvasY = map(point.y, 0, 1, 0, windowHeight);
            
            // Obtener posición anterior de este punto específico
            const prevPos = this.previousPositions[pointId];
            const isFirstFrame = !prevPos; // Es la primera vez que vemos este punto
            const pmouseX = prevPos ? prevPos.x : canvasX;
            const pmouseY = prevPos ? prevPos.y : canvasY;
            
            // Guardar la posición actual para el próximo frame
            this.previousPositions[pointId] = { x: canvasX, y: canvasY };
            
            // Actualizar o crear cursor para visualización
            if (index !== undefined) {
                this.cursors[index].set(canvasX, canvasY, true, brushSize);
            } else {
                this.cursors.push(new CursorPoint(canvasX, canvasY, pointId, true, brushSize));
            }
            
            // Para Line Brush: guardar punto inicial cuando aparece
            if (brushType === 'line' && isFirstFrame) {
                // Guardar punto inicial para este cursor LIDAR
                if (!this.lineStartPoints) this.lineStartPoints = {};
                this.lineStartPoints[pointId] = { x: canvasX, y: canvasY };
                console.log(`Line Brush: Punto inicial guardado para ${pointId}`);
                return; // No dibujar aún
            }
            
            // NO dibujar en el primer frame para otros brushes
            if (isFirstFrame && brushType !== 'line') {
                console.log(`Punto LIDAR ${pointId} detectado por primera vez, esperando siguiente frame para dibujar`);
                return; // Salir del forEach para este punto
            }
            
            // DIBUJAR localmente (excepto line brush que dibuja al desaparecer)
            if (window.drawBuffer && window.dibujarCoso && brushType !== 'line') {
                const col = color(colorValue);
                col.setAlpha(alphaValue);
                
                const drawData = {
                    c1: col,
                    s: brushSize,
                    av: alphaValue,
                    bt: brushType,
                    bc: false
                };
                
                // Agregar parámetros específicos según el tipo de pincel
                if (brushType === 'pixel') {
                    drawData.cols = window.gridCols || 32;
                    drawData.rows = window.gridRows || 32;
                } else if (brushType === 'art') {
                    drawData.particleCount = parseInt(document.getElementById('particleCount').value) || 10;
                } else if (brushType === 'text') {
                    drawData.textContent = document.getElementById('textContent').value || 'TEXTO';
                    drawData.textSize = parseInt(document.getElementById('textSize').value) || 40;
                    drawData.textFont = document.getElementById('textFont').value || 'Arial';
                } else if (brushType === 'geometry') {
                    drawData.polygonSides = parseInt(document.getElementById('polygonSides').value) || 5;
                } else if (brushType === 'fill') {
                    drawData.fillTolerance = parseInt(document.getElementById('fillTolerance').value) || 0;
                }
                
                // Guardar temporalmente las posiciones anteriores globales
                const tempPmouseX = window.pmouseXGlobal;
                const tempPmouseY = window.pmouseYGlobal;
                
                // Establecer las posiciones anteriores específicas de este punto
                window.pmouseXGlobal = pmouseX;
                window.pmouseYGlobal = pmouseY;
                
                dibujarCoso(drawBuffer, canvasX, canvasY, drawData);
                
                // Restaurar las posiciones anteriores globales
                window.pmouseXGlobal = tempPmouseX;
                window.pmouseYGlobal = tempPmouseY;
                
                // ENVIAR por socket si shouldBroadcast es true
                if (shouldBroadcast && window.socket && window.sessionId) {
                    // Crear objeto de datos completo para enviar
                    const socketData = {
                        x: point.x, // Ya normalizado (0-1)
                        y: point.y, // Ya normalizado (0-1)
                        pmouseX: map(pmouseX, 0, windowWidth, 0, 1), // Normalizar posición anterior
                        pmouseY: map(pmouseY, 0, windowHeight, 0, 1), // Normalizar posición anterior
                        c1: col,
                        s: brushSize,
                        av: alphaValue,
                        bt: brushType,
                        bc: false,
                        session: sessionId,
                        sourceType: 'lidar', // Identificar origen
                        pointId: point.id
                    };
                    
                    // Agregar parámetros específicos del pincel
                    if (brushType === 'pixel') {
                        socketData.cols = window.gridCols || 32;
                        socketData.rows = window.gridRows || 32;
                    } else if (brushType === 'art') {
                        socketData.particleCount = parseInt(document.getElementById('particleCount').value) || 10;
                    } else if (brushType === 'text') {
                        socketData.textContent = document.getElementById('textContent').value || 'TEXTO';
                        socketData.textSize = parseInt(document.getElementById('textSize').value) || 40;
                        socketData.textFont = document.getElementById('textFont').value || 'Arial';
                    } else if (brushType === 'geometry') {
                        socketData.polygonSides = parseInt(document.getElementById('polygonSides').value) || 5;
                    } else if (brushType === 'fill') {
                        socketData.fillTolerance = parseInt(document.getElementById('fillTolerance').value) || 0;
                    }
                    
                    // Si hay syncParams del art brush, normalizarlos antes de enviar
                    if (drawData.syncParams) {
                        const syncParams = drawData.syncParams;
                        
                        // Normalizar las coordenadas del canvas a valores entre 0 y 1
                        const normalizedSyncParams = {
                            x: map(syncParams.x, 0, windowWidth, 0, 1),
                            y: map(syncParams.y, 0, windowHeight, 0, 1),
                            pmouseX: map(syncParams.pmouseX, 0, windowWidth, 0, 1),
                            pmouseY: map(syncParams.pmouseY, 0, windowHeight, 0, 1),
                            count: syncParams.count,
                            size: syncParams.size,
                            baseSeed: syncParams.baseSeed,
                            mouseDirection: syncParams.mouseDirection,
                            mouseSpeed: syncParams.mouseSpeed
                        };
                        
                        // Si hay parámetros exactos para cada partícula, normalizarlos también
                        if (syncParams.particleParams && syncParams.particleParams.length > 0) {
                            const normalizedParticleParams = [];
                            
                            for (let i = 0; i < syncParams.particleParams.length; i++) {
                                const p = syncParams.particleParams[i];
                                normalizedParticleParams.push({
                                    x: map(p.x, 0, windowWidth, 0, 1),
                                    y: map(p.y, 0, windowHeight, 0, 1),
                                    vx: p.vx,
                                    vy: p.vy,
                                    size: p.size,
                                    seed: p.seed,
                                    colorSeed: p.colorSeed
                                });
                            }
                            
                            normalizedSyncParams.particleParams = normalizedParticleParams;
                        }
                        
                        socketData.syncParams = normalizedSyncParams;
                    }
                    
                    // Enviar como evento de dibujo normal
                    if (socket && socket.connected) {
                        socket.emit('mouse', socketData);
                    }
                    
                    // TAMBIÉN enviar actualización de cursor para que se vea en otros clientes
                    const cursorData = {
                        x: point.x, // Ya normalizado (0-1)
                        y: point.y, // Ya normalizado (0-1)
                        isDrawing: true,
                        brushSize: brushSize,
                        session: sessionId,
                        socketId: pointId, // Usar el pointId como identificador único
                        isCursorOnly: false // No es solo cursor, también está dibujando
                    };
                    if (socket && socket.connected) {
                        socket.emit('cursor', cursorData);
                    }
                }
            }
        });

        console.log(`Procesados ${_json.total_points} puntos de TouchDesigner/LIDAR`);
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
