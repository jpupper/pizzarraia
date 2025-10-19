// Gallery page JavaScript - Versión mejorada con likes, comentarios y sesiones

let allImages = [];
let uniqueArtists = new Set();
let currentImageId = null;
let currentUser = null;
let currentView = 'grid';

// Check if user is logged in
checkAuth();

// Load gallery on page load
loadGallery();
loadActiveSessions();

// Auto-refresh every 30 seconds
setInterval(() => {
    loadGallery();
    loadActiveSessions();
}, 30000);

// Detectar si es móvil y cambiar vista automáticamente
if (window.innerWidth <= 768) {
    setView('scroll');
}

async function checkAuth() {
    try {
        const response = await fetch(`${config.API_URL}/api/check-session`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data.user;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}

async function loadActiveSessions() {
    try {
        // Load public sessions from the database
        const response = await fetch(`${config.API_URL}/api/sessions/public/list`);
        const data = await response.json();
        
        renderActiveSessions(data.sessions || []);
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function renderActiveSessions(sessions) {
    const container = document.getElementById('activeSessions');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p class="loading-small">No hay sesiones públicas disponibles</p>';
        return;
    }
    
    const html = sessions.map(session => `
        <div class="session-badge" onclick="goToSession('${session.sessionId}')" title="${session.description || session.name}">
            🎨 ${session.name}
            <span class="session-id">ID: ${session.sessionId}</span>
            <span class="creator">Por: ${session.creatorUsername}</span>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

function goToSession(sessionId) {
    window.location.href = `index.html?sesion=${sessionId}`;
}

async function loadGallery() {
    try {
        const response = await fetch(`${config.API_URL}/api/gallery`);
        const data = await response.json();
        
        if (data.images) {
            allImages = data.images;
            
            // Count unique artists
            uniqueArtists.clear();
            let totalLikes = 0;
            
            data.images.forEach(img => {
                if (img.username) {
                    uniqueArtists.add(img.username);
                }
                totalLikes += (img.likes || []).length;
            });
            
            // Update stats
            document.getElementById('totalImages').textContent = data.images.length;
            document.getElementById('totalArtists').textContent = uniqueArtists.size;
            document.getElementById('totalLikes').textContent = totalLikes;
            
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

function setView(view) {
    currentView = view;
    const grid = document.getElementById('galleryGrid');
    const gridBtn = document.getElementById('gridViewBtn');
    const scrollBtn = document.getElementById('scrollViewBtn');
    
    if (view === 'scroll') {
        grid.classList.add('scroll-view');
        scrollBtn.classList.add('active');
        gridBtn.classList.remove('active');
    } else {
        grid.classList.remove('scroll-view');
        gridBtn.classList.add('active');
        scrollBtn.classList.remove('active');
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
        
        const likesCount = (image.likes || []).length;
        const commentsCount = (image.comments || []).length;
        
        return `
            <div class="gallery-item" onclick="viewImage('${image._id}')">
                <div class="gallery-item-image" id="thumb-${image._id}"></div>
                <div class="gallery-item-info">
                    <h3 class="gallery-item-title">${escapeHtml(image.title)}</h3>
                    <p class="gallery-item-author">Por: ${escapeHtml(image.savedBy || image.username)}</p>
                    <p class="gallery-item-date">${formattedDate}</p>
                    <div style="display: flex; gap: 15px; margin-top: 10px; color: #999; font-size: 0.9rem;">
                        <span>❤️ ${likesCount}</span>
                        <span>💬 ${commentsCount}</span>
                    </div>
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
    currentImageId = imageId;
    
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
            
            // Set image data
            document.getElementById('modalImage').src = image.imageData;
            document.getElementById('modalTitle').textContent = image.title;
            document.getElementById('modalDescription').textContent = image.description || 'Sin descripción';
            document.getElementById('modalAuthor').innerHTML = `👤 Por: <strong>${escapeHtml(image.username)}</strong>`;
            document.getElementById('modalSavedBy').innerHTML = `💾 Guardado por: <strong>${escapeHtml(image.savedBy || image.username)}</strong>`;
            document.getElementById('modalDate').textContent = `📅 ${formattedDate}`;
            document.getElementById('modalSession').innerHTML = `🎨 Sesión: <strong>${image.sessionId || '0'}</strong>`;
            
            // Render collaborators
            if (image.collaborators && image.collaborators.length > 0) {
                document.getElementById('collaboratorsSection').style.display = 'block';
                document.getElementById('modalCollaborators').innerHTML = image.collaborators.map(collab =>
                    `<span class="collaborator-chip">${escapeHtml(collab.username)}</span>`
                ).join('');
            } else {
                document.getElementById('collaboratorsSection').style.display = 'none';
            }
            
            // Update likes
            updateLikeButton(image.likes || []);
            document.getElementById('likesCount').textContent = `${(image.likes || []).length} likes`;
            
            // Update comments
            renderComments(image.comments || []);
            
            // Show comment form or login prompt
            if (currentUser) {
                document.getElementById('commentForm').style.display = 'block';
                document.getElementById('loginPrompt').style.display = 'none';
            } else {
                document.getElementById('commentForm').style.display = 'none';
                document.getElementById('loginPrompt').style.display = 'block';
            }
            
            document.getElementById('imageModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading image:', error);
        alert('Error al cargar la imagen');
    }
}

function updateLikeButton(likes) {
    const likeBtn = document.getElementById('likeBtn');
    const likeText = document.getElementById('likeText');
    
    if (currentUser) {
        const userLiked = likes.some(like => like.username === currentUser.username);
        
        if (userLiked) {
            likeBtn.classList.add('liked');
            likeText.textContent = 'Te gusta';
        } else {
            likeBtn.classList.remove('liked');
            likeText.textContent = 'Me gusta';
        }
    } else {
        likeBtn.classList.remove('liked');
        likeText.textContent = 'Me gusta';
    }
}

async function toggleLike() {
    if (!currentUser) {
        alert('Debes iniciar sesión para dar like');
        return;
    }
    
    if (!currentImageId) return;
    
    try {
        const response = await fetch(`${config.API_URL}/api/images/${currentImageId}/like`, {
            method: 'POST',
            headers: config.getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Reload image to update likes
            viewImage(currentImageId);
            loadGallery(); // Refresh gallery
        } else {
            alert(data.error || 'Error al dar like');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        alert('Error al dar like');
    }
}

function renderComments(comments) {
    const commentsList = document.getElementById('commentsList');
    const commentsCount = document.getElementById('commentsCount');
    
    commentsCount.textContent = comments.length;
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No hay comentarios aún</p>';
        return;
    }
    
    const html = comments.map(comment => {
        const date = new Date(comment.createdAt);
        const formattedDate = date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const canDelete = currentUser && currentUser.username === comment.username;
        
        return `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.username)}</span>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                <p class="comment-text">${escapeHtml(comment.text)}</p>
                ${canDelete ? `<button class="comment-delete" onclick="deleteComment('${comment._id}')">Eliminar</button>` : ''}
            </div>
        `;
    }).join('');
    
    commentsList.innerHTML = html;
}

async function submitComment() {
    if (!currentUser) {
        alert('Debes iniciar sesión para comentar');
        return;
    }
    
    if (!currentImageId) return;
    
    const commentInput = document.getElementById('commentInput');
    const text = commentInput.value.trim();
    
    if (!text) {
        alert('Escribe un comentario');
        return;
    }
    
    try {
        const response = await fetch(`${config.API_URL}/api/images/${currentImageId}/comment`, {
            method: 'POST',
            headers: {
                ...config.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            commentInput.value = '';
            // Reload image to update comments
            viewImage(currentImageId);
            loadGallery(); // Refresh gallery
        } else {
            alert(data.error || 'Error al comentar');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Error al enviar comentario');
    }
}

async function deleteComment(commentId) {
    if (!confirm('¿Eliminar este comentario?')) return;
    
    try {
        const response = await fetch(`${config.API_URL}/api/images/${currentImageId}/comment/${commentId}`, {
            method: 'DELETE',
            headers: config.getAuthHeaders()
        });
        
        if (response.ok) {
            // Reload image to update comments
            viewImage(currentImageId);
            loadGallery(); // Refresh gallery
        } else {
            alert('Error al eliminar comentario');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error al eliminar comentario');
    }
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
    currentImageId = null;
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

// Make functions global
window.viewImage = viewImage;
window.closeModal = closeModal;
window.toggleLike = toggleLike;
window.submitComment = submitComment;
window.deleteComment = deleteComment;
window.setView = setView;
window.goToSession = goToSession;
