// imagebrush.js - Implementación del pincel de imagen

/**
 * Sistema de gestión de imágenes para el Image Brush
 */
class ImageBrushManager {
    constructor() {
        this.currentImage = null; // Imagen p5.Image actual
        this.imageData = null; // Data URL de la imagen (para sincronización)
        this.imageSize = 50; // Tamaño fijo de la imagen (50x50)
        this.isLoading = false;
    }
    
    /**
     * Cargar una imagen desde un archivo
     * @param {File} file - Archivo de imagen
     * @returns {Promise} - Promesa que se resuelve cuando la imagen está lista
     */
    loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('El archivo debe ser una imagen'));
                return;
            }
            
            this.isLoading = true;
            
            // Crear un FileReader para leer el archivo
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    // Crear un canvas temporal para redimensionar
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.imageSize;
                    tempCanvas.height = this.imageSize;
                    const ctx = tempCanvas.getContext('2d');
                    
                    // Dibujar la imagen redimensionada
                    ctx.drawImage(img, 0, 0, this.imageSize, this.imageSize);
                    
                    // Obtener la data URL de la imagen redimensionada
                    this.imageData = tempCanvas.toDataURL('image/png');
                    
                    // Cargar la imagen en p5.js
                    loadImage(this.imageData, (p5img) => {
                        this.currentImage = p5img;
                        this.isLoading = false;
                        console.log('Imagen cargada y redimensionada a 50x50');
                        
                        // Actualizar preview en la UI
                        this.updatePreview();
                        
                        resolve({
                            image: this.currentImage,
                            imageData: this.imageData
                        });
                    }, (err) => {
                        this.isLoading = false;
                        reject(err);
                    });
                };
                
                img.onerror = () => {
                    this.isLoading = false;
                    reject(new Error('Error al cargar la imagen'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                this.isLoading = false;
                reject(new Error('Error al leer el archivo'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Cargar una imagen desde data URL (para sincronización)
     * @param {string} imageData - Data URL de la imagen
     * @returns {Promise} - Promesa que se resuelve cuando la imagen está lista
     */
    loadImageFromData(imageData) {
        return new Promise((resolve, reject) => {
            this.isLoading = true;
            this.imageData = imageData;
            
            loadImage(imageData, (p5img) => {
                this.currentImage = p5img;
                this.isLoading = false;
                console.log('Imagen sincronizada recibida');
                resolve(this.currentImage);
            }, (err) => {
                this.isLoading = false;
                reject(err);
            });
        });
    }
    
    /**
     * Actualizar el preview de la imagen en la UI
     */
    updatePreview() {
        const previewElement = document.getElementById('imageBrushPreview');
        if (previewElement && this.imageData) {
            previewElement.src = this.imageData;
            previewElement.style.display = 'block';
        }
    }
    
    /**
     * Limpiar la imagen actual
     */
    clearImage() {
        this.currentImage = null;
        this.imageData = null;
        
        const previewElement = document.getElementById('imageBrushPreview');
        if (previewElement) {
            previewElement.src = '';
            previewElement.style.display = 'none';
        }
    }
    
    /**
     * Verificar si hay una imagen cargada
     */
    hasImage() {
        return this.currentImage !== null;
    }
    
    /**
     * Obtener los datos de la imagen para sincronización
     */
    getImageData() {
        return this.imageData;
    }
}

// Instancia global del gestor de imágenes
let imageBrushManager = null;

/**
 * Obtener o crear la instancia del gestor de imágenes
 */
function getImageBrushManager() {
    if (!imageBrushManager) {
        imageBrushManager = new ImageBrushManager();
    }
    return imageBrushManager;
}

/**
 * Función para dibujar una imagen básica
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} size - Tamaño del pincel (escala de la imagen)
 * @param {p5.Image} image - Imagen a dibujar
 * @param {number} alpha - Transparencia (0-255)
 */
function drawImageStamp(buffer, x, y, size, image, alpha) {
    if (!image) return;
    
    buffer.push();
    buffer.imageMode(CENTER);
    buffer.tint(255, alpha);
    
    // Escalar la imagen según el tamaño del pincel
    const scaledSize = size;
    buffer.image(image, x, y, scaledSize, scaledSize);
    
    buffer.noTint();
    buffer.pop();
}

/**
 * Función helper para dibujar con una imagen específica (con kaleidoscopio)
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X
 * @param {number} y - Posición Y
 * @param {number} size - Tamaño del pincel
 * @param {p5.Image} image - Imagen a dibujar
 * @param {number} alpha - Transparencia (0-255)
 * @param {number} segments - Número de segmentos para kaleidoscopio
 * @param {number} centerX - Centro X del kaleidoscopio
 * @param {number} centerY - Centro Y del kaleidoscopio
 */
function drawImageStampWithImage(buffer, x, y, size, image, alpha, segments = 1, centerX = null, centerY = null) {
    if (!image) return;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        drawImageStamp(buffer, x, y, size, image, alpha);
    } else {
        // Con efecto caleidoscopio
        const kCenterX = centerX !== null ? centerX : windowWidth / 2;
        const kCenterY = centerY !== null ? centerY : windowHeight / 2;
        
        // Usar la función de kaleidoscopio para dibujar
        drawKaleidoscope(
            buffer,
            x, y,
            kCenterX, kCenterY,
            segments,
            drawImageStamp,
            size, image, alpha
        );
    }
}

/**
 * Dibujar el Image Brush con posible efecto caleidoscopio
 * @param {p5.Graphics} buffer - Buffer donde dibujar
 * @param {number} x - Posición X del mouse
 * @param {number} y - Posición Y del mouse
 * @param {number} size - Tamaño del pincel
 * @param {number} alpha - Transparencia (0-255)
 * @param {string} imageData - Data URL de la imagen (para dibujar lo que otros clientes dibujan)
 * @param {number} segments - Número de segmentos para el efecto caleidoscopio
 * @param {number} centerX - Centro X del kaleidoscopio (opcional, para sincronización)
 * @param {number} centerY - Centro Y del kaleidoscopio (opcional, para sincronización)
 */
function drawImageBrush(buffer, x, y, size, alpha, imageData = null, segments = 1, centerX = null, centerY = null) {
    const manager = getImageBrushManager();
    
    // Si viene imageData de otro cliente, usarlo TEMPORALMENTE solo para este dibujo
    let imageToUse = manager.currentImage;
    
    if (imageData && imageData !== manager.getImageData()) {
        // Cargar la imagen del otro cliente TEMPORALMENTE para este frame
        // Crear una imagen temporal sin afectar la selección local
        loadImage(imageData, (tempImage) => {
            // Dibujar con la imagen temporal del otro cliente
            drawImageStampWithImage(buffer, x, y, size, tempImage, alpha, segments, centerX, centerY);
        });
        return;
    }
    
    // Verificar que hay una imagen cargada localmente
    if (!manager.hasImage()) {
        // No dibujar si no hay imagen local
        return;
    }
    
    const image = manager.currentImage;
    
    // Obtener el número de segmentos para el efecto caleidoscopio
    segments = segments || 1;
    
    if (segments <= 1) {
        // Sin efecto caleidoscopio, dibujar normalmente
        drawImageStamp(buffer, x, y, size, image, alpha);
    } else {
        // Con efecto caleidoscopio - usar coordenadas recibidas o las locales
        const kCenterX = centerX !== null ? centerX : (kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2);
        const kCenterY = centerY !== null ? centerY : (kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2);
        
        // Usar la función de kaleidoscopio para dibujar
        drawKaleidoscope(
            buffer,
            x, y,
            kCenterX, kCenterY,
            segments,
            drawImageStamp,
            size, image, alpha
        );
    }
}

/**
 * Manejar la carga de archivo de imagen
 */
function handleImageBrushFileUpload() {
    const fileInput = document.getElementById('imageBrushFile');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return;
    }
    
    const file = fileInput.files[0];
    const manager = getImageBrushManager();
    
    // Mostrar indicador de carga
    if (typeof toast !== 'undefined') {
        toast.info('Cargando imagen...');
    }
    
    manager.loadImageFromFile(file)
        .then((result) => {
            console.log('Imagen cargada exitosamente');
            if (typeof toast !== 'undefined') {
                toast.success('Imagen cargada (50x50)');
            }
            
            // NO sincronizar - cada cliente mantiene su propia selección
            // syncImageBrushToOthers(result.imageData);
        })
        .catch((err) => {
            console.error('Error al cargar imagen:', err);
            if (typeof toast !== 'undefined') {
                toast.error('Error al cargar la imagen');
            }
        });
}

/**
 * Sincronizar la imagen del brush con otros clientes
 * @param {string} imageData - Data URL de la imagen
 */
function syncImageBrushToOthers(imageData) {
    if (!config.sockets.sendEnabled || !socket || !socket.connected) {
        return;
    }
    
    // Enviar la imagen a otros clientes
    socket.emit('image_brush_sync', {
        sessionId: sessionId,
        imageData: imageData
    });
    
    console.log('Imagen del brush sincronizada con otros clientes');
}

/**
 * Recibir sincronización de imagen de otros clientes
 * @param {Object} data - Datos de sincronización
 */
function receiveImageBrushSync(data) {
    if (!config.sockets.receiveEnabled) {
        return;
    }
    
    const manager = getImageBrushManager();
    
    manager.loadImageFromData(data.imageData)
        .then(() => {
            console.log('Imagen del brush sincronizada desde otro cliente');
            if (typeof toast !== 'undefined') {
                toast.info('Imagen del brush actualizada');
            }
        })
        .catch((err) => {
            console.error('Error al sincronizar imagen:', err);
        });
}

/**
 * Limpiar la imagen del brush
 */
function clearImageBrush() {
    const manager = getImageBrushManager();
    manager.clearImage();
    
    // Limpiar el input de archivo
    const fileInput = document.getElementById('imageBrushFile');
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (typeof toast !== 'undefined') {
        toast.info('Imagen del brush eliminada');
    }
}

/**
 * Cargar un emoji como preset para el image brush
 * @param {string} emoji - El emoji a cargar
 */
function loadEmojiPreset(emoji) {
    // Crear un canvas temporal para renderizar el emoji
    const tempCanvas = document.createElement('canvas');
    const size = 50; // Tamaño fijo 50x50
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');
    
    // Fondo transparente
    ctx.clearRect(0, 0, size, size);
    
    // Configurar el texto del emoji
    ctx.font = '40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dibujar el emoji en el centro
    ctx.fillText(emoji, size / 2, size / 2);
    
    // Convertir a data URL
    const imageData = tempCanvas.toDataURL('image/png');
    
    // Cargar en el image brush manager
    const manager = getImageBrushManager();
    manager.loadImageFromData(imageData)
        .then(() => {
            console.log('Emoji preset cargado:', emoji);
            if (typeof toast !== 'undefined') {
                toast.success(`Emoji ${emoji} cargado`);
            }
        })
        .catch((err) => {
            console.error('Error al cargar emoji preset:', err);
            if (typeof toast !== 'undefined') {
                toast.error('Error al cargar emoji');
            }
        });
}
