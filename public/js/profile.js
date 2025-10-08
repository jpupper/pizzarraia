// Profile page JavaScript
let currentUser = null;
let userImages = [];

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${config.API_URL}/api/check-session`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = data.user;
        loadUserProfile();
        loadUserImages();
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'login.html';
    }
}

function loadUserProfile() {
    document.getElementById('username').textContent = currentUser.username;
    document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    
    // Get user details for member since date
    fetch(`${config.API_URL}/api/user`, {
            headers: config.getAuthHeaders()
        })
        .then(res => res.json())
        .then(data => {
            if (data.user && data.user.createdAt) {
                const date = new Date(data.user.createdAt);
                document.getElementById('memberSince').textContent = date.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        })
        .catch(err => console.error('Error loading user details:', err));
}

async function loadUserImages() {
    try {
        const response = await fetch(`${config.API_URL}/api/images`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        userImages = data.images || [];
        document.getElementById('imageCount').textContent = userImages.length;
        
        renderGallery();
    } catch (error) {
        console.error('Error loading images:', error);
        document.getElementById('galleryContent').innerHTML = `
            <div class="empty-state">
                <p style="color: #f44336;">Error al cargar las imágenes</p>
            </div>
        `;
    }
}

function renderGallery() {
    const galleryContent = document.getElementById('galleryContent');
    
    if (userImages.length === 0) {
        galleryContent.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
                <h3>No tienes dibujos guardados</h3>
                <p>Comienza a crear y guarda tus obras de arte</p>
                <a href="index.html" class="btn btn-primary">Crear mi primer dibujo</a>
            </div>
        `;
        return;
    }
    
    galleryContent.innerHTML = `<div class="gallery-grid" id="galleryGrid"></div>`;
    const galleryGrid = document.getElementById('galleryGrid');
    
    userImages.forEach(image => {
        const date = new Date(image.createdAt);
        const formattedDate = date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        // Crear elemento img y cargar la imagen
        const imgElement = document.createElement('img');
        imgElement.className = 'gallery-item-image';
        imgElement.alt = escapeHtml(image.title);
        imgElement.style.cursor = 'pointer';
        imgElement.onclick = () => viewImage(image._id);
        
        // Cargar la imagen completa para la miniatura
        fetch(`${config.API_URL}/api/images/${image._id}`, {
                headers: config.getAuthHeaders()
            })
            .then(res => res.json())
            .then(data => {
                if (data.image && data.image.imageData) {
                    imgElement.src = data.image.imageData;
                }
            })
            .catch(err => console.error('Error loading thumbnail:', err));
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'gallery-item-info';
        infoDiv.innerHTML = `
            <h3 class="gallery-item-title">${escapeHtml(image.title)}</h3>
            <p class="gallery-item-date">${formattedDate}</p>
            <div class="gallery-item-actions">
                <button class="btn btn-primary btn-small" onclick="viewImage('${image._id}')">Ver</button>
                <button class="btn btn-secondary btn-small" onclick="downloadImage('${image._id}', '${escapeHtml(image.title)}')">Descargar</button>
                <button class="btn btn-danger btn-small" onclick="deleteImage('${image._id}')">Eliminar</button>
            </div>
        `;
        
        item.appendChild(imgElement);
        item.appendChild(infoDiv);
        galleryGrid.appendChild(item);
    });
}

let currentImageId = null;

async function viewImage(imageId) {
    currentImageId = imageId;
    
    try {
        // Usar la ruta de galería que tiene todos los datos
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
            loadUserImages(); // Refresh gallery
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
            loadUserImages(); // Refresh gallery
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
            loadUserImages(); // Refresh gallery
        } else {
            alert('Error al eliminar comentario');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Error al eliminar comentario');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function downloadImage(imageId, title) {
    try {
        const response = await fetch(`${config.API_URL}/api/images/${imageId}`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.image) {
            // Crear un enlace temporal para descargar
            const link = document.createElement('a');
            link.href = data.image.imageData;
            link.download = `${title || 'dibujo'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('Error downloading image:', error);
        alert('Error al descargar la imagen');
    }
}

async function deleteImage(imageId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este dibujo?')) {
        return;
    }
    
    try {
        const response = await fetch(`${config.API_URL}/api/images/${imageId}`, {
            method: 'DELETE',
            headers: config.getAuthHeaders()
        });
        
        if (response.ok) {
            loadUserImages();
        } else {
            alert('Error al eliminar la imagen');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        alert('Error al eliminar la imagen');
    }
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('active');
}

async function logout() {
    try {
        await fetch(`${config.API_URL}/api/logout`, { 
            method: 'POST',
            headers: config.getAuthHeaders()
        });
        
        // Remove token from localStorage
        config.removeToken();
        
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = 'login.html';
    }
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

// Initialize
checkAuth();
