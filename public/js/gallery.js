// Gallery page JavaScript

let allImages = [];
let uniqueArtists = new Set();

// Load gallery on page load
loadGallery();

// Auto-refresh every 30 seconds
setInterval(loadGallery, 30000);

async function loadGallery() {
    try {
        const response = await fetch(`${config.API_URL}/api/gallery`);
        const data = await response.json();
        
        if (data.images) {
            allImages = data.images;
            
            // Count unique artists
            uniqueArtists.clear();
            data.images.forEach(img => {
                if (img.username) {
                    uniqueArtists.add(img.username);
                }
            });
            
            // Update stats
            document.getElementById('totalImages').textContent = data.images.length;
            document.getElementById('totalArtists').textContent = uniqueArtists.size;
            
            renderGallery(data.images);
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        document.getElementById('galleryGrid').innerHTML = `
            <div class="empty-state">
                <h3>Error al cargar la galería</h3>
                <p>Por favor, intenta de nuevo más tarde</p>
            </div>
        `;
    }
}

function renderGallery(images) {
    const grid = document.getElementById('galleryGrid');
    
    if (images.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>La galería está vacía</h3>
                <p>¡Sé el primero en crear una obra de arte!</p>
                <a href="index.html" class="btn btn-primary">Crear mi Arte</a>
            </div>
        `;
        return;
    }
    
    const html = images.map(image => {
        const date = new Date(image.createdAt);
        const formattedDate = date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="gallery-item" onclick="viewImage('${image._id}')">
                <div class="gallery-item-image" id="thumb-${image._id}"></div>
                <div class="gallery-item-info">
                    <h3 class="gallery-item-title">${escapeHtml(image.title)}</h3>
                    <p class="gallery-item-author">Por: ${escapeHtml(image.username)}</p>
                    <p class="gallery-item-date">${formattedDate}</p>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = html;
    
    // Load thumbnails
    images.forEach(image => {
        loadThumbnail(image._id);
    });
}

async function loadThumbnail(imageId) {
    try {
        const response = await fetch(`${config.API_URL}/api/gallery/${imageId}`);
        const data = await response.json();
        
        if (data.image && data.image.imageData) {
            const thumbElement = document.getElementById(`thumb-${imageId}`);
            if (thumbElement) {
                thumbElement.style.backgroundImage = `url(${data.image.imageData})`;
                thumbElement.style.backgroundSize = 'cover';
                thumbElement.style.backgroundPosition = 'center';
            }
        }
    } catch (error) {
        console.error('Error loading thumbnail:', error);
    }
}

async function viewImage(imageId) {
    try {
        const response = await fetch(`${config.API_URL}/api/gallery/${imageId}`);
        const data = await response.json();
        
        if (data.image) {
            const image = data.image;
            const date = new Date(image.createdAt);
            const formattedDate = date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            document.getElementById('modalImage').src = image.imageData;
            document.getElementById('modalTitle').textContent = image.title;
            document.getElementById('modalAuthor').textContent = `Por: ${image.username}`;
            document.getElementById('modalDate').textContent = formattedDate;
            document.getElementById('imageModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading image:', error);
        alert('Error al cargar la imagen');
    }
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal on background click
document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageModal') {
        closeModal();
    }
});

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
