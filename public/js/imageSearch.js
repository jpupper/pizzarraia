/**
 * Sistema de búsqueda de imágenes para ImageBrush
 * Usa la API de Pixabay (gratuita, sin autenticación)
 */

// API Key de Pixabay (pública, limitada a 100 requests/min)
const PIXABAY_API_KEY = '47609563-e2e5e5f7e5d9e5e5e5e5e5e5'; // Reemplazar con tu propia key

/**
 * Busca imágenes en Pixabay
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
        // Usar Pixabay API
        const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=9&safesearch=true`);
        
        if (!response.ok) {
            throw new Error('Error en la búsqueda');
        }
        
        const data = await response.json();
        
        if (data.hits && data.hits.length > 0) {
            renderImageResults(data.hits);
        } else {
            resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.8rem;">No se encontraron imágenes</p>';
        }
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
            background-image: url('${img.previewURL}');
            background-size: cover;
            background-position: center;
            border-radius: 5px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s ease;
        `;
        
        imgElement.onmouseover = () => {
            imgElement.style.border = '2px solid var(--accent)';
            imgElement.style.transform = 'scale(1.05)';
        };
        
        imgElement.onmouseout = () => {
            imgElement.style.border = '2px solid transparent';
            imgElement.style.transform = 'scale(1)';
        };
        
        imgElement.onclick = () => loadImageFromUrl(img.webformatURL);
        
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
        
        // Usar proxy para evitar CORS
        img.src = `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`;
        
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
