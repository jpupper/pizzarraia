/**
 * Sistema de búsqueda de imágenes para ImageBrush
 * Usa Lorem Picsum con IDs basados en hash del query para consistencia
 */

/**
 * Genera un hash simple de un string
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Busca imágenes usando Lorem Picsum
 */
async function searchImages() {
    const searchInput = document.getElementById('imageSearchInput');
    const resultsContainer = document.getElementById('imageSearchResults');
    const query = searchInput.value.trim();
    
    if (!query) {
        resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.8rem;">Escribe algo para buscar</p>';
        return;
    }
    
    // Mostrar loading
    resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.7); font-size: 0.8rem;">Buscando...</p>';
    
    try {
        // Usar Lorem Picsum con IDs basados en hash del query
        const baseHash = simpleHash(query);
        const images = [];
        
        for (let i = 0; i < 9; i++) {
            // Generar IDs consistentes basados en el query
            const imageId = (baseHash + i * 37) % 1000; // 0-999
            const cacheBuster = Date.now(); // Para forzar recarga
            images.push({
                id: imageId,
                url: `https://picsum.photos/id/${imageId}/200/200?t=${cacheBuster}`,
                download_url: `https://picsum.photos/id/${imageId}/400/400?t=${cacheBuster}`
            });
        }
        
        renderImageResults(images);
    } catch (error) {
        console.error('Error buscando imágenes:', error);
        resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,67,54,0.8); font-size: 0.8rem;">Error al buscar. Intenta de nuevo.</p>';
    }
}

/**
 * Renderiza los resultados de búsqueda
 */
function renderImageResults(images) {
    const resultsContainer = document.getElementById('imageSearchResults');
    resultsContainer.innerHTML = '';
    
    images.forEach(img => {
        const imgElement = document.createElement('div');
        imgElement.style.cssText = `
            width: 100%;
            aspect-ratio: 1;
            background-image: url('${img.url}');
            background-size: cover;
            background-position: center;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        imgElement.onmouseover = () => {
            imgElement.style.border = '2px solid var(--accent)';
            imgElement.style.transform = 'scale(1.08)';
            imgElement.style.boxShadow = '0 4px 16px rgba(138, 79, 191, 0.4)';
        };
        
        imgElement.onmouseout = () => {
            imgElement.style.border = '2px solid rgba(255,255,255,0.1)';
            imgElement.style.transform = 'scale(1)';
            imgElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        };
        
        imgElement.onclick = () => loadImageFromUrl(img.download_url);
        
        resultsContainer.appendChild(imgElement);
    });
}

/**
 * Carga una imagen desde una URL y la convierte para el brush
 */
async function loadImageFromUrl(imageUrl) {
    try {
        // Mostrar loading
        if (typeof toast !== 'undefined') {
            toast.info('Cargando imagen...');
        }
        
        // Crear imagen temporal
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Para evitar problemas de CORS
        
        img.onload = () => {
            // Crear canvas temporal para redimensionar a 100x100
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 100;
            tempCanvas.height = 100;
            const ctx = tempCanvas.getContext('2d');
            
            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, 100, 100);
            
            // Obtener data URL
            const imageData = tempCanvas.toDataURL('image/png');
            
            // Cargar en el ImageBrushManager
            const manager = getImageBrushManager();
            if (manager) {
                loadImage(imageData, (p5img) => {
                    manager.currentImage = p5img;
                    manager.imageData = imageData;
                    manager.updatePreview();
                    
                    if (typeof toast !== 'undefined') {
                        toast.success('Imagen cargada!');
                    }
                    
                    console.log('Imagen cargada desde búsqueda');
                });
            }
        };
        
        img.onerror = () => {
            if (typeof toast !== 'undefined') {
                toast.error('Error al cargar la imagen');
            }
        };
        
        // Lorem Picsum no necesita proxy
        img.src = imageUrl;
        
    } catch (error) {
        console.error('Error cargando imagen:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Error al cargar la imagen');
        }
    }
}

/**
 * Permite buscar con Enter
 */
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('imageSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchImages();
            }
        });
    }
});
