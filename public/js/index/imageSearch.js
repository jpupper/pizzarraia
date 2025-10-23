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
 * Busca stickers/emojis usando OpenMoji API (sin CORS)
 */
async function searchImages() {
    const searchInput = document.getElementById('imageSearchInput');
    const resultsContainer = document.getElementById('imageSearchResults');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5); font-size: 0.8rem;">Escribe algo para buscar</p>';
        return;
    }
    
    // Mostrar loading
    resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.7); font-size: 0.8rem;">Buscando...</p>';
    
    try {
        // Usar OpenMoji API - emojis con transparencia
        const response = await fetch('https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json');
        const allEmojis = await response.json();
        
        // Filtrar emojis que coincidan con la búsqueda
        const matchingEmojis = allEmojis.filter(emoji => {
            const annotation = emoji.annotation ? emoji.annotation.toLowerCase() : '';
            const tags = emoji.tags ? emoji.tags.toLowerCase() : '';
            return annotation.includes(query) || tags.includes(query);
        }).slice(0, 9); // Tomar solo los primeros 9
        
        // Si no hay coincidencias, buscar emojis populares
        if (matchingEmojis.length === 0) {
            resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.7); font-size: 0.8rem;">No se encontraron resultados. Mostrando emojis populares...</p>';
            const popularEmojis = allEmojis.filter(e => e.group === 'smileys-emotion').slice(0, 9);
            renderEmojiResults(popularEmojis);
            return;
        }
        
        renderEmojiResults(matchingEmojis);
    } catch (error) {
        console.error('Error buscando emojis:', error);
        resultsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: rgba(255,67,54,0.8); font-size: 0.8rem;">Error al buscar. Intenta de nuevo.</p>';
    }
}

/**
 * Renderiza los resultados de emojis
 */
function renderEmojiResults(emojis) {
    const resultsContainer = document.getElementById('imageSearchResults');
    resultsContainer.innerHTML = '';
    
    emojis.forEach(emoji => {
        const emojiElement = document.createElement('div');
        const emojiUrl = `https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg/${emoji.hexcode}.svg`;
        
        emojiElement.style.cssText = `
            width: 100%;
            aspect-ratio: 1;
            background-image: url('${emojiUrl}');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            border-radius: 8px;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        emojiElement.onmouseover = () => {
            emojiElement.style.transform = 'scale(1.1)';
            emojiElement.style.borderColor = 'rgba(138, 79, 191, 0.8)';
        };
        
        emojiElement.onmouseout = () => {
            emojiElement.style.transform = 'scale(1)';
            emojiElement.style.borderColor = 'rgba(255,255,255,0.1)';
        };
        
        emojiElement.onclick = async () => {
            try {
                const response = await fetch(emojiUrl);
                const svgText = await response.text();
                const blob = new Blob([svgText], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                
                const img = new Image();
                img.onload = () => {
                    // Cambiar a ImageBrush y cargar la imagen
                    const brushTypeSelect = document.getElementById('brushType');
                    if (brushTypeSelect) {
                        brushTypeSelect.value = 'image';
                        brushTypeSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // Cargar imagen en el ImageBrush
                    if (window.brushRegistry) {
                        const imageBrush = brushRegistry.get('image');
                        if (imageBrush && typeof imageBrush.loadImageFromElement === 'function') {
                            imageBrush.loadImageFromElement(img);
                            console.log('Emoji cargado:', emoji.annotation);
                        }
                    }
                    URL.revokeObjectURL(url);
                };
                img.src = url;
            } catch (error) {
                console.error('Error cargando emoji:', error);
            }
        };
        
        resultsContainer.appendChild(emojiElement);
    });
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
