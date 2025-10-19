// Profile page JavaScript
let currentUser = null;
let userImages = [];
let userSessions = [];

// Available brush types
const BRUSH_TYPES = [
    { id: 'standard', name: 'Pincel Estándar' },
    { id: 'art', name: 'Pincel Artístico' },
    { id: 'pixel', name: 'Pincel Pixel' },
    { id: 'line', name: 'Línea' },
    { id: 'geometry', name: 'Geometría' },
    { id: 'flower', name: 'Flores' },
    { id: 'fill', name: 'Relleno' },
    { id: 'image', name: 'Imagen' },
    { id: 'text', name: 'Texto' }
];

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
        loadUserSessions();
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
            
            // Render layer selector if layers exist
            renderLayerSelector(image);
            
            document.getElementById('imageModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading image:', error);
        if (typeof toast !== 'undefined') toast.error('Error al cargar la imagen');
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
        if (typeof toast !== 'undefined') toast.warning('Debes iniciar sesión para dar like');
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
            if (typeof toast !== 'undefined') toast.error(data.error || 'Error al dar like');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        if (typeof toast !== 'undefined') toast.error('Error al dar like');
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
        if (typeof toast !== 'undefined') toast.warning('Debes iniciar sesión para comentar');
        return;
    }
    
    const commentInput = document.getElementById('commentInput');
    const text = commentInput.value.trim();
    
    if (!text) {
        if (typeof toast !== 'undefined') toast.warning('Escribe un comentario');
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
            if (typeof toast !== 'undefined') toast.error(data.error || 'Error al comentar');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        if (typeof toast !== 'undefined') toast.error('Error al enviar comentario');
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
            if (typeof toast !== 'undefined') toast.error('Error al eliminar comentario');
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        if (typeof toast !== 'undefined') toast.error('Error al eliminar comentario');
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
        if (typeof toast !== 'undefined') toast.error('Error al descargar la imagen');
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
            if (typeof toast !== 'undefined') toast.success('Imagen eliminada');
        } else {
            if (typeof toast !== 'undefined') toast.error('Error al eliminar la imagen');
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        if (typeof toast !== 'undefined') toast.error('Error al eliminar la imagen');
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

// Variable global para almacenar la imagen actual
let currentViewingImage = null;

// Render layer selector
function renderLayerSelector(image) {
    const layersSelector = document.getElementById('layersSelector');
    const layerButtons = document.getElementById('layerButtons');
    const modalImage = document.getElementById('modalImage');
    
    // Guardar referencia a la imagen actual
    currentViewingImage = image;
    
    if (!image.layers || image.layers.length === 0) {
        layersSelector.style.display = 'none';
        return;
    }
    
    layersSelector.style.display = 'block';
    layerButtons.innerHTML = '';
    
    // Botón para ver imagen combinada
    const combinedBtn = document.createElement('button');
    combinedBtn.className = 'layer-btn combined active';
    combinedBtn.textContent = '🎨 Todas las capas';
    combinedBtn.onclick = () => {
        modalImage.src = image.imageData;
        document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
        combinedBtn.classList.add('active');
    };
    layerButtons.appendChild(combinedBtn);
    
    // Botones para cada capa individual
    image.layers.forEach((layer, index) => {
        const layerBtn = document.createElement('button');
        layerBtn.className = 'layer-btn';
        layerBtn.textContent = layer.name || `Capa ${index}`;
        layerBtn.onclick = () => {
            modalImage.src = layer.imageData;
            document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
            layerBtn.classList.add('active');
        };
        layerButtons.appendChild(layerBtn);
    });
}

// Función para descargar capas como ZIP
async function downloadLayers() {
    if (!currentViewingImage || !currentViewingImage.layers || currentViewingImage.layers.length === 0) {
        if (typeof toast !== 'undefined') toast.warning('No hay capas para descargar');
        return;
    }
    
    try {
        // Verificar que JSZip esté disponible
        if (typeof JSZip === 'undefined') {
            if (typeof toast !== 'undefined') toast.error('Error: Librería de compresión no disponible');
            return;
        }
        
        const zip = new JSZip();
        const imageName = currentViewingImage.title || 'dibujo';
        
        // Agregar imagen combinada
        const combinedData = currentViewingImage.imageData.split(',')[1]; // Remover el prefijo data:image/png;base64,
        zip.file(`${imageName}_combined.png`, combinedData, { base64: true });
        
        // Agregar cada capa individual
        currentViewingImage.layers.forEach((layer, index) => {
            const layerData = layer.imageData.split(',')[1];
            const layerName = layer.name || `Capa_${index}`;
            zip.file(`${imageName}_${layerName}.png`, layerData, { base64: true });
        });
        
        // Generar el ZIP y descargarlo
        if (typeof toast !== 'undefined') toast.info('Generando archivo ZIP...');
        
        const content = await zip.generateAsync({ type: 'blob' });
        
        // Crear enlace de descarga
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${imageName}_capas.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (typeof toast !== 'undefined') toast.success('¡Capas descargadas exitosamente!');
    } catch (error) {
        console.error('Error descargando capas:', error);
        if (typeof toast !== 'undefined') toast.error('Error al descargar las capas');
    }
}

// Close modal on background click
document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageModal') {
        closeModal();
    }
});

// ========== SESSION MANAGEMENT ==========

async function loadUserSessions() {
    try {
        const response = await fetch(`${config.API_URL}/api/sessions/my-sessions`, {
            headers: config.getAuthHeaders()
        });
        const data = await response.json();
        
        userSessions = data.sessions || [];
        renderUserSessions();
    } catch (error) {
        console.error('Error loading sessions:', error);
        document.getElementById('mySessionsContainer').innerHTML = `
            <p class="empty-state">Error al cargar las sesiones</p>
        `;
    }
}

function renderUserSessions() {
    const container = document.getElementById('mySessionsContainer');
    
    if (userSessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No tienes sesiones creadas</h3>
                <p>Crea tu primera sesión para comenzar a colaborar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userSessions.map(session => `
        <div class="session-card">
            <h3>Sesión ${session.sessionId}</h3>
            <p><strong>${session.name}</strong></p>
            ${session.description ? `<p class="session-info">${session.description}</p>` : ''}
            <div class="session-info">
                <span class="session-badge ${session.isPublic ? 'public' : 'private'}">
                    ${session.isPublic ? '🌐 Pública' : '🔒 Privada'}
                </span>
            </div>
            <div class="session-info">
                <strong>Herramientas:</strong> ${session.allowedBrushTypes.length} disponibles
            </div>
            <div class="session-info">
                Creada: ${new Date(session.createdAt).toLocaleDateString('es-ES')}
            </div>
            <div class="session-actions">
                <a href="index.html?session=${session.sessionId}" class="btn btn-primary btn-small">Ir a Sesión</a>
                <button onclick="editSession('${session._id}')" class="btn btn-secondary btn-small">Editar</button>
                <button onclick="deleteSession('${session._id}')" class="btn btn-danger btn-small">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function openCreateSessionModal() {
    const modal = document.getElementById('sessionModal');
    document.getElementById('sessionModalTitle').textContent = 'Crear Nueva Sesión';
    document.getElementById('sessionForm').reset();
    
    // Populate brush types
    populateBrushTypes();
    
    modal.classList.add('active');
}

function closeSessionModal() {
    const modal = document.getElementById('sessionModal');
    modal.classList.remove('active');
}

function populateBrushTypes() {
    const container = document.getElementById('brushTypesContainer');
    
    container.innerHTML = BRUSH_TYPES.map(brush => `
        <div class="brush-type-item selected" onclick="toggleBrushType(this, '${brush.id}')">
            <input type="checkbox" id="brush_${brush.id}" value="${brush.id}" checked>
            <label for="brush_${brush.id}">${brush.name}</label>
        </div>
    `).join('');
}

function toggleBrushType(element, brushId) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }
}

async function saveSession(event) {
    event.preventDefault();
    
    const sessionId = document.getElementById('sessionIdInput').value;
    const name = document.getElementById('sessionName').value;
    const description = document.getElementById('sessionDescription').value;
    const isPublic = document.getElementById('sessionIsPublic').checked;
    
    // Get selected brush types
    const selectedBrushes = Array.from(document.querySelectorAll('#brushTypesContainer input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    if (selectedBrushes.length === 0) {
        if (typeof toast !== 'undefined') {
            toast.error('Debes seleccionar al menos una herramienta');
        } else {
            alert('Debes seleccionar al menos una herramienta');
        }
        return;
    }
    
    try {
        const response = await fetch(`${config.API_URL}/api/sessions/create`, {
            method: 'POST',
            headers: {
                ...config.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                name,
                description,
                isPublic,
                allowedBrushTypes: selectedBrushes
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (typeof toast !== 'undefined') {
                toast.success('Sesión creada exitosamente');
            } else {
                alert('Sesión creada exitosamente');
            }
            closeSessionModal();
            loadUserSessions();
        } else {
            throw new Error(data.error || 'Error al crear la sesión');
        }
    } catch (error) {
        console.error('Error saving session:', error);
        if (typeof toast !== 'undefined') {
            toast.error(error.message);
        } else {
            alert('Error: ' + error.message);
        }
    }
}

async function deleteSession(sessionId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sesión?')) {
        return;
    }
    
    try {
        const response = await fetch(`${config.API_URL}/api/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: config.getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (typeof toast !== 'undefined') {
                toast.success('Sesión eliminada');
            } else {
                alert('Sesión eliminada');
            }
            loadUserSessions();
        } else {
            throw new Error(data.error || 'Error al eliminar la sesión');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        if (typeof toast !== 'undefined') {
            toast.error(error.message);
        } else {
            alert('Error: ' + error.message);
        }
    }
}

async function editSession(sessionId) {
    // TODO: Implement edit functionality
    if (typeof toast !== 'undefined') {
        toast.info('Función de edición próximamente');
    } else {
        alert('Función de edición próximamente');
    }
}

// Close session modal on background click
document.getElementById('sessionModal').addEventListener('click', (e) => {
    if (e.target.id === 'sessionModal') {
        closeSessionModal();
    }
});

// Initialize
checkAuth();
