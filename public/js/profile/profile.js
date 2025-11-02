// Profile page JavaScript
let currentUser = null;
let userImages = [];
let userSessions = [];
let currentEditingSessionId = null; // ID de MongoDB de la sesión en edición
let currentEditingSession = null; // Datos completos de la sesión en edición
let socket = null; // Socket.IO connection

// BRUSH_TYPES se obtiene dinámicamente del BrushRegistry
// Esto garantiza que SIEMPRE esté sincronizado con los brushes reales
function getBrushTypes() {
    if (typeof window.brushRegistry === 'undefined') {
        console.warn('⚠️ BrushRegistry no disponible, usando lista por defecto');
        // Fallback si brushRegistry no está disponible
        return [
            { id: 'classic', name: 'Pincel Clásico' },
            { id: 'art', name: 'Pincel Artístico' },
            { id: 'pixel', name: 'Pincel Pixel' },
            { id: 'line', name: 'Línea' },
            { id: 'geometry', name: 'Geometría' },
            { id: 'flower', name: 'Flores' },
            { id: 'fill', name: 'Relleno' },
            { id: 'image', name: 'Imagen' },
            { id: 'text', name: 'Texto' }
        ];
    }
    
    // Obtener todos los brushes del registry y extraer su metadata
    const allBrushes = window.brushRegistry.getAllIds();
    return allBrushes.map(id => {
        const brush = window.brushRegistry.get(id);
        if (brush && typeof brush.getMetadata === 'function') {
            const metadata = brush.getMetadata();
            return {
                id: metadata.id,
                name: metadata.name,
                title: metadata.title,
                icon: metadata.icon
            };
        }
        // Fallback si el brush no tiene getMetadata
        return { id: id, name: id };
    });
}

// Mantener referencia para compatibilidad
let BRUSH_TYPES = [];

// Additional restrictions (treated as special brushes)
const ADDITIONAL_RESTRICTIONS = [
    { id: 'allowKaleidoscope', name: '🔮 Kaleidoscopio', icon: '🔮' },
    { id: 'allowLayers', name: '📚 Capas', icon: '📚' },
    { id: 'allowCleanBackground', name: '💣 Limpiar Canvas', icon: '💣' }
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
    
    // Get user details for member since date and permissions
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
            
            // Check permissions and show/hide UI elements
            const user = data.user;
            const canCreateSessions = user.permissions && user.permissions.canCreateSessions;
            const canAccessAdmin = user.permissions && user.permissions.canAccessAdmin;
            
            // Show/hide create session button
            const createSessionBtn = document.querySelector('.create-session-btn');
            if (createSessionBtn) {
                if (canCreateSessions) {
                    createSessionBtn.style.display = 'block';
                } else {
                    createSessionBtn.style.display = 'none';
                    // Show message about no permissions
                    const sessionsContainer = document.querySelector('.sessions-container');
                    if (sessionsContainer && !document.querySelector('.no-permission-message')) {
                        const message = document.createElement('div');
                        message.className = 'no-permission-message';
                        message.style.cssText = 'background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;';
                        message.innerHTML = '⚠️ No tienes permisos para crear sesiones. Contacta al administrador.';
                        sessionsContainer.insertBefore(message, sessionsContainer.firstChild);
                    }
                }
            }
            
            // Show/hide admin panel link
            const adminLink = document.querySelector('.admin-link');
            if (adminLink) {
                adminLink.style.display = canAccessAdmin ? 'block' : 'none';
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
    
    container.innerHTML = userSessions.map(session => {
        // Generar información de configuración de acceso
        let accessInfo = '';
        if (session.accessConfig) {
            const accessParts = [];
            
            // Usuarios NO registrados
            if (session.accessConfig.notLogged?.allowed) {
                const restrictions = [];
                if (session.accessConfig.notLogged.restrictions) {
                    if (!session.accessConfig.notLogged.restrictions.allowKaleidoscope) restrictions.push('🚫 Kaleidoscopio');
                    if (!session.accessConfig.notLogged.restrictions.allowLayers) restrictions.push('🚫 Capas');
                    if (!session.accessConfig.notLogged.restrictions.allowCleanBackground) restrictions.push('🚫 Limpiar Canvas');
                }
                const restrictText = restrictions.length > 0 ? ` (${restrictions.join(', ')})` : '';
                accessParts.push(`👤 No Registrados: ${session.accessConfig.notLogged.brushes.length} herramientas${restrictText}`);
            }
            
            // Usuarios registrados
            if (session.accessConfig.logged?.allowed) {
                const restrictions = [];
                if (session.accessConfig.logged.restrictions) {
                    if (!session.accessConfig.logged.restrictions.allowKaleidoscope) restrictions.push('🚫 Kaleidoscopio');
                    if (!session.accessConfig.logged.restrictions.allowLayers) restrictions.push('🚫 Capas');
                    if (!session.accessConfig.logged.restrictions.allowCleanBackground) restrictions.push('🚫 Limpiar Canvas');
                }
                const restrictText = restrictions.length > 0 ? ` (${restrictions.join(', ')})` : '';
                accessParts.push(`🔐 Registrados: ${session.accessConfig.logged.brushes.length} herramientas${restrictText}`);
            }
            
            // Usuarios específicos
            if (session.accessConfig.specific?.allowed) {
                const restrictions = [];
                if (session.accessConfig.specific.restrictions) {
                    if (!session.accessConfig.specific.restrictions.allowKaleidoscope) restrictions.push('🚫 Kaleidoscopio');
                    if (!session.accessConfig.specific.restrictions.allowLayers) restrictions.push('🚫 Capas');
                    if (!session.accessConfig.specific.restrictions.allowCleanBackground) restrictions.push('🚫 Limpiar Canvas');
                }
                const restrictText = restrictions.length > 0 ? ` (${restrictions.join(', ')})` : '';
                accessParts.push(`👥 Específicos (${session.accessConfig.specific.users.join(', ')}): ${session.accessConfig.specific.brushes.length} herramientas${restrictText}`);
            }
            
            accessInfo = accessParts.length > 0 ? accessParts.join('<br>') : 'Sin restricciones';
        } else if (session.allowedBrushTypes) {
            accessInfo = `${session.allowedBrushTypes.length} herramientas disponibles`;
        }
        
        // Ya no usamos restrictionsInfo global, está por tipo de usuario
        let restrictionsInfo = '';
        
        return `
            <div class="session-card">
                <div class="session-card-header">
                    <h3>Sesión ${session.sessionId}</h3>
                    <span class="session-badge ${session.isPublic ? 'public' : 'private'}">
                        ${session.isPublic ? '🌐 Pública' : '🔒 Privada'}
                    </span>
                </div>
                <p class="session-name"><strong>${session.name}</strong></p>
                ${session.description ? `<p class="session-description">${session.description}</p>` : ''}
                
                <div class="session-config-details">
                    <div class="config-section">
                        <strong>👥 Acceso:</strong>
                        <div class="config-content">${accessInfo}</div>
                    </div>
                    ${restrictionsInfo}
                </div>
                
                <div class="session-meta">
                    <small>Creada: ${new Date(session.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}</small>
                </div>
                
                <div class="session-actions">
                    <a href="index.html?sesion=${session.sessionId}" class="btn btn-primary btn-small">🎨 Ir a Sesión</a>
                    <a href="gallery.html?sesion=${session.sessionId}" class="btn btn-secondary btn-small" target="_blank">🖼️ Galería</a>
                    <button onclick="editSession('${session._id}')" class="btn btn-secondary btn-small">✏️ Editar</button>
                    <button onclick="deleteSession('${session._id}')" class="btn btn-danger btn-small">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function openCreateSessionModal() {
    const modal = document.getElementById('sessionModal');
    modal.dataset.editingMode = 'false';
    modal.dataset.editingSessionId = '';
    
    document.getElementById('sessionModalTitle').textContent = 'Crear Nueva Sesión';
    document.getElementById('sessionForm').reset();
    
    // Generar ID de sesión automáticamente (15 dígitos)
    const sessionId = generateSessionId();
    document.getElementById('sessionIdInput').value = sessionId;
    
    // Limpiar personalización
    currentBackgroundImage = '';
    currentLogoImage = '';
    document.getElementById('backgroundImagePreview').style.display = 'none';
    document.getElementById('logoImagePreview').style.display = 'none';
    document.getElementById('backgroundImageInput').value = '';
    document.getElementById('logoImageInput').value = '';
    
    // Resetear colores a defaults
    document.getElementById('colorBackground').value = '#1a1a2e';
    document.getElementById('colorPrimary').value = '#667eea';
    document.getElementById('colorSecondary').value = '#764ba2';
    document.getElementById('colorText').value = '#ffffff';
    
    // Desactivar checkbox de colores personalizados
    document.getElementById('useCustomColors').checked = false;
    document.getElementById('customColorsContainer').style.opacity = '0.5';
    document.getElementById('customColorsContainer').style.pointerEvents = 'none';
    
    // Populate brush types for each user type
    populateBrushTypesForAllUsers();
    
    // Setup access control listeners
    setupAccessControlListeners();
    
    // Initialize layer configuration
    setupLayerConfiguration();
    // Forzar que inicie con 1 capa y generar configuración inicial
    const layerCountInputInit = document.getElementById('layerCount');
    if (layerCountInputInit) {
        layerCountInputInit.value = '1';
        generateLayerConfiguration(1);
    }
    
    // Initialize default image brush configuration
    setupDefaultImageBrush();
    // Asegurar que el contenedor esté visible y el botón disponible
    const defaultImagesContainerEl = document.getElementById('defaultImagesContainer');
    if (defaultImagesContainerEl) {
        defaultImagesContainerEl.style.display = 'block';
    }

    // Generar la primera capa visible
    generateLayerConfiguration();
    
    modal.classList.add('active');
}

function generateSessionId() {
    // Generar un ID de 15 dígitos
    // Formato: timestamp (13 dígitos) + random (2 dígitos)
    const timestamp = Date.now().toString(); // 13 dígitos
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // 2 dígitos
    return timestamp + random;
}

function populateBrushTypesForAllUsers() {
    // Actualizar BRUSH_TYPES dinámicamente desde el registry
    BRUSH_TYPES = getBrushTypes();
    console.log('🎨 Brushes cargados dinámicamente:', BRUSH_TYPES);
    
    // Poblar para usuarios NO registrados
    populateBrushTypesForUserType('notLoggedBrushes', 'notLogged');
    
    // Poblar para usuarios registrados
    populateBrushTypesForUserType('loggedBrushes', 'logged');
    
    // Poblar para usuarios específicos
    populateBrushTypesForUserType('specificBrushes', 'specific');
}

function populateBrushTypesForUserType(containerId, userType) {
    const container = document.getElementById(containerId);
    
    // Generar brushes (nombres vienen directamente de los brushes)
    const brushesHTML = BRUSH_TYPES.map(brush => `
        <div class="brush-type-item selected" onclick="toggleBrushTypeForUser(this, '${brush.id}', '${userType}')">
            <input type="checkbox" id="brush_${userType}_${brush.id}" value="${brush.id}" checked>
            <label for="brush_${userType}_${brush.id}">${brush.name}</label>
        </div>
    `).join('');
    
    // Generar restricciones adicionales (kaleidoscopio, capas)
    const restrictionsHTML = ADDITIONAL_RESTRICTIONS.map(restriction => `
        <div class="brush-type-item selected" onclick="toggleBrushTypeForUser(this, '${restriction.id}', '${userType}')">
            <input type="checkbox" 
                   id="brush_${userType}_${restriction.id}" 
                   value="${restriction.id}" 
                   class="restriction-checkbox" 
                   data-user-type="${userType}" 
                   data-restriction="${restriction.id}" 
                   checked>
            <label for="brush_${userType}_${restriction.id}">${restriction.name}</label>
        </div>
    `).join('');
    
    container.innerHTML = brushesHTML + restrictionsHTML;
}

function toggleBrushTypeForUser(element, brushId, userType) {
    console.log('\n🖱️ ========== BOTÓN APRETADO ==========');
    console.log('🎯 Brush ID:', brushId);
    console.log('👤 User Type:', userType);
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const checkbox = element.querySelector('input[type="checkbox"]');
    const oldValue = checkbox.checked;
    checkbox.checked = !checkbox.checked;
    
    console.log('🔄 Estado cambiado:', oldValue, '→', checkbox.checked);
    
    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }
    
    // LLAMAR DIRECTAMENTE autoSaveSession (sin disparar evento change para evitar duplicados)
    console.log('💾 Llamando autoSaveSession directamente...');
    autoSaveSession();
    console.log('========== FIN BOTÓN APRETADO ==========\n');
}

function setupAccessControlListeners() {
    // Listener para usuarios específicos
    const allowSpecificCheckbox = document.getElementById('allowSpecific');
    const specificUsersConfig = document.getElementById('specificUsersConfig');
    
    allowSpecificCheckbox.addEventListener('change', function() {
        if (this.checked) {
            specificUsersConfig.style.display = 'block';
        } else {
            specificUsersConfig.style.display = 'none';
        }
    });
    
    // Listeners para habilitar/deshabilitar secciones
    ['allowNotLogged', 'allowLogged', 'allowSpecific'].forEach(id => {
        const checkbox = document.getElementById(id);
        checkbox.addEventListener('change', function() {
            const section = this.closest('.access-config-section');
            if (this.checked) {
                section.style.opacity = '1';
            } else {
                section.style.opacity = '0.6';
            }
        });
    });
}

function closeSessionModal() {
    const modal = document.getElementById('sessionModal');
    modal.classList.remove('active');
    // Limpiar variables de edición
    currentEditingSessionId = null;
    currentEditingSession = null;
    // Recargar sesiones para mostrar cambios
    if (currentUser) {
        loadUserSessions();
    }
}

async function saveSession(event) {
    event.preventDefault();
    
    const sessionId = document.getElementById('sessionIdInput').value;
    const name = document.getElementById('sessionName').value;
    const description = document.getElementById('sessionDescription').value;
    const isPublic = document.getElementById('sessionIsPublic').checked;
    
    // Recopilar configuración de acceso para cada tipo de usuario
    const accessConfig = {};
    
    // Usuarios NO registrados
    const allowNotLogged = document.getElementById('allowNotLogged').checked;
    if (allowNotLogged) {
        const allChecked = Array.from(document.querySelectorAll('#notLoggedBrushes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        // Separar brushes de restricciones
        const brushes = allChecked.filter(id => !id.startsWith('allow'));
        const restrictions = {
            allowKaleidoscope: allChecked.includes('allowKaleidoscope'),
            allowLayers: allChecked.includes('allowLayers'),
            allowCleanBackground: allChecked.includes('allowCleanBackground')
        };
        
        accessConfig.notLogged = {
            allowed: true,
            brushes: brushes,
            restrictions: restrictions
        };
    } else {
        accessConfig.notLogged = {
            allowed: false,
            brushes: [],
            restrictions: {
                allowKaleidoscope: true,
                allowLayers: true,
                allowCleanBackground: true
            }
        };
    }
    
    // Usuarios registrados
    const allowLogged = document.getElementById('allowLogged').checked;
    if (allowLogged) {
        const allChecked = Array.from(document.querySelectorAll('#loggedBrushes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        // Separar brushes de restricciones
        const brushes = allChecked.filter(id => !id.startsWith('allow'));
        const restrictions = {
            allowKaleidoscope: allChecked.includes('allowKaleidoscope'),
            allowLayers: allChecked.includes('allowLayers'),
            allowCleanBackground: allChecked.includes('allowCleanBackground')
        };
        
        accessConfig.logged = {
            allowed: true,
            brushes: brushes,
            restrictions: restrictions
        };
    } else {
        accessConfig.logged = {
            allowed: false,
            brushes: [],
            restrictions: {
                allowKaleidoscope: true,
                allowLayers: true,
                allowCleanBackground: true
            }
        };
    }
    
    // Usuarios específicos
    const allowSpecific = document.getElementById('allowSpecific').checked;
    if (allowSpecific) {
        const specificUsers = document.getElementById('specificUsers').value
            .split(',')
            .map(u => u.trim())
            .filter(u => u.length > 0);
        const allChecked = Array.from(document.querySelectorAll('#specificBrushes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (specificUsers.length === 0) {
            if (typeof toast !== 'undefined') {
                toast.error('Debes especificar al menos un usuario para "Usuarios Específicos"');
            } else {
                alert('Debes especificar al menos un usuario para "Usuarios Específicos"');
            }
            return;
        }
        
        // Separar brushes de restricciones
        const brushes = allChecked.filter(id => !id.startsWith('allow'));
        const restrictions = {
            allowKaleidoscope: allChecked.includes('allowKaleidoscope'),
            allowLayers: allChecked.includes('allowLayers'),
            allowCleanBackground: allChecked.includes('allowCleanBackground')
        };
        
        accessConfig.specific = {
            allowed: true,
            users: specificUsers,
            brushes: brushes,
            restrictions: restrictions
        };
    } else {
        accessConfig.specific = {
            allowed: false,
            users: [],
            brushes: [],
            restrictions: {
                allowKaleidoscope: true,
                allowLayers: true,
                allowCleanBackground: true
            }
        };
    }
    
    // Validar que al menos un tipo de usuario tenga acceso
    if (!allowNotLogged && !allowLogged && !allowSpecific) {
        if (typeof toast !== 'undefined') {
            toast.error('Debes permitir acceso a al menos un tipo de usuario');
        } else {
            alert('Debes permitir acceso a al menos un tipo de usuario');
        }
        return;
    }
    
    // Get additional restrictions (ya no se usan aquí, están en accessConfig)
    // const allowKaleidoscope = document.getElementById('allowKaleidoscope')?.checked || false;
    // const allowLayers = document.getElementById('allowLayers')?.checked || false;
    
    // Verificar si estamos en modo edición
    const modal = document.getElementById('sessionModal');
    const isEditing = modal.dataset.editingMode === 'true';
    const editingSessionId = modal.dataset.editingSessionId;
    
    try {
        const url = isEditing 
            ? `${config.API_URL}/api/sessions/${editingSessionId}`
            : `${config.API_URL}/api/sessions/create`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        // Determinar si usar colores personalizados
        const useCustomColors = document.getElementById('useCustomColors')?.checked || false;
        const colors = useCustomColors ? {
            background: document.getElementById('colorBackground')?.value || '#1a1a2e',
            primary: document.getElementById('colorPrimary')?.value || '#667eea',
            secondary: document.getElementById('colorSecondary')?.value || '#764ba2',
            text: document.getElementById('colorText')?.value || '#ffffff'
        } : {
            background: '#1a1a2e',
            primary: '#667eea',
            secondary: '#764ba2',
            text: '#ffffff'
        };
        
        // Collect initial layer configuration
        const initialLayers = collectLayerConfiguration();
        
        // Collect default image brush configuration
        const defaultImageBrush = collectDefaultImageBrushConfiguration();
        
        const requestBody = {
            sessionId,
            name,
            description,
            isPublic,
            accessConfig: accessConfig,
            customization: {
                backgroundImage: currentBackgroundImage || '',
                logoImage: currentLogoImage || '',
                colors: colors
            },
            initialLayers: initialLayers,
            defaultImageBrush: defaultImageBrush
        };
        
        console.log('📤 Enviando request:', { url, method });
        console.log('📦 Body completo:', requestBody);
        console.log('🖼️ Logo length:', currentLogoImage ? currentLogoImage.length : 0);
        console.log('🎨 Background length:', currentBackgroundImage ? currentBackgroundImage.length : 0);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...config.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (response.ok) {
            if (typeof toast !== 'undefined') {
                toast.success(isEditing ? 'Sesión actualizada exitosamente' : 'Sesión creada exitosamente');
            } else {
                alert(isEditing ? 'Sesión actualizada exitosamente' : 'Sesión creada exitosamente');
            }
            
            // Si estamos editando, notificar por WebSocket
            if (isEditing && typeof socket !== 'undefined' && socket.connected) {
                socket.emit('session-updated', {
                    sessionId: sessionId,
                    accessConfig: accessConfig,
                    customization: requestBody.customization
                });
            }
            
            closeSessionModal();
            loadUserSessions(); // Recargar la lista
        } else {
            throw new Error(data.message || `Error al ${isEditing ? 'actualizar' : 'crear'} la sesión`);
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
    console.log('🔧 editSession llamada con ID:', sessionId);
    console.log('📋 userSessions disponibles:', userSessions);
    
    try {
        // Buscar la sesión en el array local
        const session = userSessions.find(s => s._id === sessionId);
        console.log('🔍 Sesión encontrada:', session);
        
        if (!session) {
            console.error('❌ Sesión no encontrada en el array local');
            if (typeof toast !== 'undefined') {
                toast.error('Sesión no encontrada');
            } else {
                alert('Sesión no encontrada');
            }
            return;
        }
        
        // Guardar sesión actual en edición
        currentEditingSessionId = sessionId;
        currentEditingSession = session;
        
        // Abrir modal en modo edición
        const modal = document.getElementById('sessionModal');
        modal.dataset.editingMode = 'true';
        modal.dataset.editingSessionId = sessionId;
        
        document.getElementById('sessionModalTitle').textContent = 'Editar Sesión - Guardado Automático';
        
        // Llenar el formulario con los datos actuales
        document.getElementById('sessionIdInput').value = session.sessionId;
        document.getElementById('sessionName').value = session.name;
        document.getElementById('sessionDescription').value = session.description || '';
        document.getElementById('sessionIsPublic').checked = session.isPublic;
        
        // Populate brush types
        populateBrushTypesForAllUsers();
        
        // Desmarcar todos los checkboxes primero (brushes Y restricciones)
        document.querySelectorAll('.brush-types-grid input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            cb.closest('.brush-type-item')?.classList.remove('selected');
        });
        
        // Configurar acceso según la sesión
        if (session.accessConfig) {
            // Usuarios NO registrados
            document.getElementById('allowNotLogged').checked = session.accessConfig.notLogged?.allowed || false;
            if (session.accessConfig.notLogged?.brushes) {
                session.accessConfig.notLogged.brushes.forEach(brushId => {
                    const checkbox = document.getElementById(`brush_notLogged_${brushId}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.closest('.brush-type-item')?.classList.add('selected');
                    }
                });
            }
            if (session.accessConfig.notLogged?.restrictions) {
                // Cargar restricciones (ahora están como checkboxes normales en el grid)
                Object.keys(session.accessConfig.notLogged.restrictions).forEach(restrictionKey => {
                    const checkbox = document.getElementById(`brush_notLogged_${restrictionKey}`);
                    if (checkbox) {
                        checkbox.checked = session.accessConfig.notLogged.restrictions[restrictionKey] !== false;
                        if (checkbox.checked) {
                            checkbox.closest('.brush-type-item')?.classList.add('selected');
                        }
                    }
                });
            }
            
            // Usuarios registrados
            document.getElementById('allowLogged').checked = session.accessConfig.logged?.allowed || false;
            if (session.accessConfig.logged?.brushes) {
                session.accessConfig.logged.brushes.forEach(brushId => {
                    const checkbox = document.getElementById(`brush_logged_${brushId}`);
                    if (checkbox) {
                        checkbox.checked = true;
                        checkbox.closest('.brush-type-item')?.classList.add('selected');
                    }
                });
            }
            if (session.accessConfig.logged?.restrictions) {
                // Cargar restricciones (ahora están como checkboxes normales en el grid)
                Object.keys(session.accessConfig.logged.restrictions).forEach(restrictionKey => {
                    const checkbox = document.getElementById(`brush_logged_${restrictionKey}`);
                    if (checkbox) {
                        checkbox.checked = session.accessConfig.logged.restrictions[restrictionKey] !== false;
                        if (checkbox.checked) {
                            checkbox.closest('.brush-type-item')?.classList.add('selected');
                        }
                    }
                });
            }
            
            // Usuarios específicos
            document.getElementById('allowSpecific').checked = session.accessConfig.specific?.allowed || false;
            if (session.accessConfig.specific?.allowed) {
                document.getElementById('specificUsers').value = session.accessConfig.specific.users.join(', ');
                document.getElementById('specificUsersConfig').style.display = 'block';
                if (session.accessConfig.specific.brushes) {
                    session.accessConfig.specific.brushes.forEach(brushId => {
                        const checkbox = document.getElementById(`brush_specific_${brushId}`);
                        if (checkbox) {
                            checkbox.checked = true;
                            checkbox.closest('.brush-type-item')?.classList.add('selected');
                        }
                    });
                }
                if (session.accessConfig.specific?.restrictions) {
                    // Cargar restricciones (ahora están como checkboxes normales en el grid)
                    Object.keys(session.accessConfig.specific.restrictions).forEach(restrictionKey => {
                        const checkbox = document.getElementById(`brush_specific_${restrictionKey}`);
                        if (checkbox) {
                            checkbox.checked = session.accessConfig.specific.restrictions[restrictionKey] !== false;
                            if (checkbox.checked) {
                                checkbox.closest('.brush-type-item')?.classList.add('selected');
                            }
                        }
                    });
                }
            }
        }
        
        // Cargar personalización si existe
        if (session.customization) {
            if (session.customization.backgroundImage) {
                currentBackgroundImage = session.customization.backgroundImage;
                document.getElementById('backgroundImagePreview').style.display = 'block';
                document.getElementById('previewImg').src = currentBackgroundImage;
            } else {
                currentBackgroundImage = '';
                document.getElementById('backgroundImagePreview').style.display = 'none';
            }
            
            if (session.customization.logoImage) {
                currentLogoImage = session.customization.logoImage;
                document.getElementById('logoImagePreview').style.display = 'block';
                document.getElementById('logoPreviewImg').src = currentLogoImage;
            } else {
                currentLogoImage = '';
                document.getElementById('logoImagePreview').style.display = 'none';
            }
            
            // Cargar colores
            if (session.customization.colors) {
                const colors = session.customization.colors;
                document.getElementById('colorBackground').value = colors.background || '#1a1a2e';
                document.getElementById('colorPrimary').value = colors.primary || '#667eea';
                document.getElementById('colorSecondary').value = colors.secondary || '#764ba2';
                document.getElementById('colorText').value = colors.text || '#ffffff';
                
                // Activar checkbox si los colores son diferentes a los defaults
                const hasCustomColors = colors.background !== '#1a1a2e' || 
                                       colors.primary !== '#667eea' || 
                                       colors.secondary !== '#764ba2' || 
                                       colors.text !== '#ffffff';
                
                const checkbox = document.getElementById('useCustomColors');
                const container = document.getElementById('customColorsContainer');
                if (hasCustomColors) {
                    checkbox.checked = true;
                    container.style.opacity = '1';
                    container.style.pointerEvents = 'auto';
                } else {
                    checkbox.checked = false;
                    container.style.opacity = '0.5';
                    container.style.pointerEvents = 'none';
                }
            }
        } else {
            // Limpiar si no hay personalización
            currentBackgroundImage = '';
            currentLogoImage = '';
            document.getElementById('backgroundImagePreview').style.display = 'none';
            document.getElementById('logoImagePreview').style.display = 'none';
            // Resetear colores a defaults
            document.getElementById('colorBackground').value = '#1a1a2e';
            document.getElementById('colorPrimary').value = '#667eea';
            document.getElementById('colorSecondary').value = '#764ba2';
            document.getElementById('colorText').value = '#ffffff';
        }

        // Cargar configuración de imágenes por defecto para Brush de Imagen
        try {
            const container = document.getElementById('defaultImagesContainer');
            const list = document.getElementById('defaultImagesList');
            
            // Reset UI
            if (container) container.style.display = 'block';
            if (list) list.innerHTML = '';
            
            if (session.defaultImageBrush) {
                const images = Array.isArray(session.defaultImageBrush.images) ? session.defaultImageBrush.images : [];
                images.forEach(img => {
                    if (img && img.imageData) {
                        addDefaultImageWithData(img.imageData);
                    }
                });
            }
        } catch (e) {
            console.warn('No se pudo cargar defaultImageBrush:', e);
        }
        
        // Setup listeners con auto-save
        console.log('⚙️ Configurando auto-save listeners...');
        setupAutoSaveListeners();
        
        // Unirse a la sesión para recibir actualizaciones en tiempo real
        if (socket && socket.connected && session.sessionId) {
            socket.emit('join_session', session.sessionId);
            console.log(`🔗 Profile unido a sesión ${session.sessionId} para sincronización en tiempo real`);
        }
        
        console.log('✅ Abriendo modal...');
        modal.classList.add('active');
        console.log('✅ Modal abierto, clase active agregada');
        
    } catch (error) {
        console.error('❌ Error loading session for edit:', error);
        if (typeof toast !== 'undefined') {
            toast.error('Error al cargar la sesión');
        } else {
            alert('Error al cargar la sesión');
        }
    }
}

/**
 * Configura listeners para auto-guardado en cada cambio
 * USA EVENT DELEGATION para que funcione con elementos dinámicos
 */
function setupAutoSaveListeners() {
    console.log('\n🔧 [PROFILE] ========== CONFIGURANDO LISTENERS ==========');
    
    // EVENT DELEGATION en el modal completo
    const modal = document.getElementById('sessionModal');
    
    if (!modal) {
        console.error('❌ [PROFILE] Modal NO encontrado!');
        return;
    }
    
    console.log('✅ [PROFILE] Modal encontrado:', modal);
    console.log('📊 [PROFILE] Checkboxes en modal:', modal.querySelectorAll('input[type="checkbox"]').length);
    console.log('📊 [PROFILE] Brush grids:', modal.querySelectorAll('.brush-types-grid').length);
    
    // Remover listener anterior si existe
    if (modal._autoSaveHandler) {
        console.log('🔄 [PROFILE] Removiendo listener anterior');
        modal.removeEventListener('change', modal._autoSaveHandler);
    }
    
    // Listener único con delegation
    modal._autoSaveHandler = function(e) {
        const target = e.target;
        
        // IGNORAR checkboxes de brushes (se manejan con toggleBrushTypeForUser)
        if (target.closest('.brush-types-grid')) {
            console.log('⏭️ [PROFILE] Checkbox de brush - Ya manejado por toggleBrushTypeForUser, ignorando');
            return;
        }
        
        console.log('\n🔔 [PROFILE] ========== EVENTO CHANGE DETECTADO ==========');
        console.log('📊 [PROFILE] Target:', {
            id: target.id,
            type: target.type,
            checked: target.checked,
            value: target.value,
            classList: Array.from(target.classList),
            timestamp: new Date().toISOString()
        });
        
        // Solo procesar checkboxes de control (allowNotLogged, allowLogged, sessionIsPublic, etc.)
        if (target.type === 'checkbox' && 
            (target.classList.contains('user-type-toggle') || 
             target.id === 'sessionIsPublic' ||
             target.id === 'allowNotLogged' ||
             target.id === 'allowLogged' ||
             target.id === 'allowSpecific')) {
            console.log('✅ [PROFILE] Checkbox de control detectado - Llamando autoSaveSession()');
            autoSaveSession();
        } else {
            console.log('⏭️ [PROFILE] Otro tipo de elemento - IGNORADO');
        }
    };
    
    modal.addEventListener('change', modal._autoSaveHandler);
    console.log('✅ [PROFILE] Listener agregado al modal');
    console.log('========== FIN CONFIGURACIÓN LISTENERS ==========\n');
    
    // Listener para usuarios específicos (con debounce)
    const specificUsersInput = document.getElementById('specificUsers');
    if (specificUsersInput) {
        specificUsersInput.removeEventListener('input', specificUsersInput._autoSaveHandler);
        specificUsersInput._autoSaveHandler = () => {
            clearTimeout(specificUsersInput._timeout);
            specificUsersInput._timeout = setTimeout(autoSaveSession, 1000);
        };
        specificUsersInput.addEventListener('input', specificUsersInput._autoSaveHandler);
    }
    
    // Listener para nombre y descripción (con debounce)
    const nameInput = document.getElementById('sessionName');
    const descInput = document.getElementById('sessionDescription');
    
    if (nameInput) {
        nameInput.removeEventListener('input', nameInput._autoSaveHandler);
        nameInput._autoSaveHandler = () => {
            clearTimeout(nameInput._timeout);
            nameInput._timeout = setTimeout(autoSaveSession, 1000);
        };
        nameInput.addEventListener('input', nameInput._autoSaveHandler);
    }
    
    if (descInput) {
        descInput.removeEventListener('input', descInput._autoSaveHandler);
        descInput._autoSaveHandler = () => {
            clearTimeout(descInput._timeout);
            descInput._timeout = setTimeout(autoSaveSession, 1000);
        };
        descInput.addEventListener('input', descInput._autoSaveHandler);
    }
    
    // Listener para sesión pública
    const publicCheckbox = document.getElementById('sessionIsPublic');
    if (publicCheckbox) {
        publicCheckbox.removeEventListener('change', autoSaveSession);
        publicCheckbox.addEventListener('change', autoSaveSession);
    }
    
    // Listener para mostrar/ocultar usuarios específicos
    const allowSpecificCheckbox = document.getElementById('allowSpecific');
    if (allowSpecificCheckbox) {
        allowSpecificCheckbox.removeEventListener('change', allowSpecificCheckbox._toggleHandler);
        allowSpecificCheckbox._toggleHandler = function() {
            const specificConfig = document.getElementById('specificUsersConfig');
            if (this.checked) {
                specificConfig.style.display = 'block';
            } else {
                specificConfig.style.display = 'none';
            }
        };
        allowSpecificCheckbox.addEventListener('change', allowSpecificCheckbox._toggleHandler);
    }
    
    // Listeners para colores personalizados
    const useCustomColorsCheckbox = document.getElementById('useCustomColors');
    if (useCustomColorsCheckbox) {
        useCustomColorsCheckbox.removeEventListener('change', autoSaveSession);
        useCustomColorsCheckbox.addEventListener('change', autoSaveSession);
    }
    
    // Listeners para inputs de color (con debounce)
    const colorInputs = ['colorBackground', 'colorPrimary', 'colorSecondary', 'colorText'];
    colorInputs.forEach(inputId => {
        const colorInput = document.getElementById(inputId);
        if (colorInput) {
            colorInput.removeEventListener('input', colorInput._autoSaveHandler);
            colorInput._autoSaveHandler = () => {
                clearTimeout(colorInput._timeout);
                colorInput._timeout = setTimeout(autoSaveSession, 500);
            };
            colorInput.addEventListener('input', colorInput._autoSaveHandler);
        }
    });
    
    console.log('✅ Listeners configurados correctamente (incluyendo colores)');
}

/**
 * Guarda automáticamente la sesión y envía por WebSocket - INMEDIATO
 * NO ESPERA - Envía socket primero, guarda después
 */
function autoSaveSession() {
    console.log('🚀 [PROFILE] autoSaveSession() LLAMADA:', new Date().toISOString());
    // NO AWAIT - Ejecutar en paralelo sin bloquear
    performAutoSave();
}

/**
 * Ejecuta el guardado real - INMEDIATO SIN BLOQUEOS
 */
async function performAutoSave() {
    if (!currentEditingSessionId || !currentEditingSession) {
        console.warn('No hay sesión en edición');
        return;
    }
    
    console.log('🔄 Auto-guardando sesión INMEDIATAMENTE...');
    
    // Recopilar configuración actual
    let sessionId, name, description, isPublic, accessConfig;
    
    try {
        console.log('📋 [PROFILE] Recopilando datos del formulario...');
        
        sessionId = document.getElementById('sessionIdInput')?.value;
        name = document.getElementById('sessionName')?.value;
        description = document.getElementById('sessionDescription')?.value;
        isPublic = document.getElementById('sessionIsPublic')?.checked;
        
        if (!sessionId) {
            throw new Error('sessionId no encontrado en el formulario');
        }
        
        console.log('✅ [PROFILE] Datos básicos recopilados:', { sessionId, name, isPublic });
        
        accessConfig = {};
        
        // Usuarios NO registrados
        const allowNotLogged = document.getElementById('allowNotLogged').checked;
        const notLoggedCheckboxes = Array.from(document.querySelectorAll('#notLoggedBrushes input[type=\"checkbox\"]:checked'));
        const notLoggedBrushes = notLoggedCheckboxes
            .filter(cb => !cb.classList.contains('restriction-checkbox'))
            .map(cb => cb.value);
        
        const notLoggedRestrictions = {};
        ADDITIONAL_RESTRICTIONS.forEach(restriction => {
            const checkbox = document.getElementById(`brush_notLogged_${restriction.id}`);
            notLoggedRestrictions[restriction.id] = checkbox ? checkbox.checked : true;
        });
        
        accessConfig.notLogged = {
            allowed: allowNotLogged,
            brushes: notLoggedBrushes,
            restrictions: notLoggedRestrictions
        };
        
        // Usuarios registrados
        const allowLogged = document.getElementById('allowLogged').checked;
        const loggedCheckboxes = Array.from(document.querySelectorAll('#loggedBrushes input[type=\"checkbox\"]:checked'));
        const loggedBrushes = loggedCheckboxes
            .filter(cb => !cb.classList.contains('restriction-checkbox'))
            .map(cb => cb.value);
        
        const loggedRestrictions = {};
        ADDITIONAL_RESTRICTIONS.forEach(restriction => {
            const checkbox = document.getElementById(`brush_logged_${restriction.id}`);
            loggedRestrictions[restriction.id] = checkbox ? checkbox.checked : true;
        });
        
        accessConfig.logged = {
            allowed: allowLogged,
            brushes: loggedBrushes,
            restrictions: loggedRestrictions
        };
        
        // Usuarios específicos
        const allowSpecific = document.getElementById('allowSpecific').checked;
        const specificUsers = document.getElementById('specificUsers').value
            .split(',')
            .map(u => u.trim())
            .filter(u => u.length > 0);
        const specificCheckboxes = Array.from(document.querySelectorAll('#specificBrushes input[type=\"checkbox\"]:checked'));
        const specificBrushes = specificCheckboxes
            .filter(cb => !cb.classList.contains('restriction-checkbox'))
            .map(cb => cb.value);
        
        const specificRestrictions = {};
        ADDITIONAL_RESTRICTIONS.forEach(restriction => {
            const checkbox = document.getElementById(`brush_specific_${restriction.id}`);
            specificRestrictions[restriction.id] = checkbox ? checkbox.checked : true;
        });
        
        accessConfig.specific = {
            allowed: allowSpecific,
            users: specificUsers,
            brushes: specificBrushes,
            restrictions: specificRestrictions
        };
        
        // Colores dentro de accessConfig
        const useCustomColors = document.getElementById('useCustomColors')?.checked || false;
        accessConfig.colors = useCustomColors ? {
            background: document.getElementById('colorBackground')?.value || '#1a1a2e',
            primary: document.getElementById('colorPrimary')?.value || '#667eea',
            secondary: document.getElementById('colorSecondary')?.value || '#764ba2',
            text: document.getElementById('colorText')?.value || '#ffffff'
        } : {
            background: '#1a1a2e',
            primary: '#667eea',
            secondary: '#764ba2',
            text: '#ffffff'
        };
        
        console.log('✅ [PROFILE] Configuración recopilada exitosamente');
        
    } catch (error) {
        console.error('\n❌❌❌ [PROFILE] ERROR CRÍTICO EN AUTO-GUARDADO ❌❌❌');
        console.error('Error:', error);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.error('❌❌❌ EL SOCKET NO SE ENVIARÁ PORQUE HUBO UN ERROR ❌❌❌\n');
        return; // SALIR si hay error
    }
    
    // ENVIAR SOCKET (FUERA del try-catch de recopilación)
    try {
        console.log('\n🔍 [PROFILE] ========== PREPARANDO ENVÍO SOCKET ==========');
        console.log('📊 [PROFILE] Estado del socket:', {
            existe: !!socket,
            conectado: socket?.connected,
            id: socket?.id
        });
        
        if (socket && socket.connected) {
            const updateData = {
                sessionId: sessionId,
                accessConfig: accessConfig,
                name: name,
                description: description
            };
            
            console.log('📡 [PROFILE] ENVIANDO socket session-updated:', {
                sessionId: sessionId,
                timestamp: new Date().toISOString(),
                accessConfig: {
                    notLogged: {
                        allowed: accessConfig.notLogged.allowed,
                        brushes: accessConfig.notLogged.brushes,
                        restrictions: accessConfig.notLogged.restrictions
                    },
                    logged: {
                        allowed: accessConfig.logged.allowed,
                        brushes: accessConfig.logged.brushes,
                        restrictions: accessConfig.logged.restrictions
                    },
                    specific: {
                        allowed: accessConfig.specific.allowed,
                        users: accessConfig.specific.users,
                        brushes: accessConfig.specific.brushes,
                        restrictions: accessConfig.specific.restrictions
                    }
                }
            });
            
            socket.emit('session-updated', updateData);
            console.log('✅ [PROFILE] Socket EMITIDO correctamente');
            console.log('========== FIN ENVÍO SOCKET ==========\n');
        } else {
            console.error('❌ [PROFILE] Socket NO conectado - NO SE ENVIÓ');
            console.error('   - socket existe:', !!socket);
            console.error('   - socket.connected:', socket?.connected);
        }
    } catch (socketError) {
        console.error('❌❌❌ [PROFILE] ERROR AL ENVIAR SOCKET ❌❌❌');
        console.error('Error:', socketError);
    }
    
    // GUARDAR EN DB (en paralelo, no bloqueante)
    try {
        fetch(`${config.API_URL}/api/sessions/${currentEditingSessionId}`, {
            method: 'PUT',
            headers: {
                ...config.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                name,
                description,
                isPublic,
                accessConfig
            })
        }).then(response => response.json())
        .then(data => {
            console.log('✅ [PROFILE] Sesión guardada en DB');
            
            // Actualizar sesión local
            currentEditingSession.accessConfig = accessConfig;
            currentEditingSession.name = name;
            currentEditingSession.description = description;
            currentEditingSession.isPublic = isPublic;
        })
        .catch(error => {
            console.error('❌ [PROFILE] Error guardando en DB:', error);
        });
    } catch (dbError) {
        console.error('❌ [PROFILE] Error al iniciar guardado en DB:', dbError);
    }
}

// Close session modal on background click
document.getElementById('sessionModal').addEventListener('click', (e) => {
    if (e.target.id === 'sessionModal') {
        closeSessionModal();
    }
});

// Initialize Socket.IO
function initializeSocket() {
    const socketConfig = config.getSocketConfig();
    socket = io(socketConfig.url, socketConfig.options);
    
    socket.on('connect', () => {
        console.log('✅ Socket conectado en profile');
        
        // Si hay una sesión en edición, unirse a ella
        if (currentEditingSession && currentEditingSession.sessionId) {
            socket.emit('join_session', currentEditingSession.sessionId);
            console.log(`🔗 Profile unido a sesión ${currentEditingSession.sessionId} para sincronización`);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Socket desconectado en profile');
    });
}

// Variables para imágenes de personalización
let currentBackgroundImage = '';
let currentLogoImage = '';

// Listener para imagen de fondo
document.getElementById('backgroundImageInput')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentBackgroundImage = event.target.result;
            document.getElementById('backgroundImagePreview').style.display = 'block';
            document.getElementById('previewImg').src = currentBackgroundImage;
        };
        reader.readAsDataURL(file);
    }
});

// Listener para logo
document.getElementById('logoImageInput')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentLogoImage = event.target.result;
            document.getElementById('logoImagePreview').style.display = 'block';
            document.getElementById('logoPreviewImg').src = currentLogoImage;
        };
        reader.readAsDataURL(file);
    }
});

function removeBackgroundImage() {
    currentBackgroundImage = '';
    document.getElementById('backgroundImageInput').value = '';
    document.getElementById('backgroundImagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
}

function removeLogoImage() {
    currentLogoImage = '';
    document.getElementById('logoImageInput').value = '';
    document.getElementById('logoImagePreview').style.display = 'none';
    document.getElementById('logoPreviewImg').src = '';
}

// Listener para checkbox de colores personalizados
document.getElementById('useCustomColors')?.addEventListener('change', function(e) {
    const container = document.getElementById('customColorsContainer');
    if (e.target.checked) {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    } else {
        container.style.opacity = '0.5';
        container.style.pointerEvents = 'none';
    }
});

// Exponer funciones globalmente para que sean accesibles desde HTML
// Initial Layers Configuration Functions
function setupLayerConfiguration() {
    const layerCountInput = document.getElementById('layerCount');
    const layersConfigDiv = document.getElementById('layersConfiguration');
    
    if (layerCountInput && layersConfigDiv) {
        layerCountInput.addEventListener('input', function() {
            generateLayerConfiguration(parseInt(this.value) || 1);
        });
        
        // Initialize with 1 layer
        generateLayerConfiguration(1);
    }
}

function generateLayerConfiguration(layerCount) {
    // Permitir llamada sin argumento desde el atributo onchange del HTML
    if (typeof layerCount !== 'number' || isNaN(layerCount) || layerCount < 1) {
        const layerCountInput = document.getElementById('layerCount');
        layerCount = parseInt(layerCountInput?.value) || 1;
    }
    const layersConfigDiv = document.getElementById('layersConfiguration');
    if (!layersConfigDiv) return;
    
    layersConfigDiv.innerHTML = '';
    
    for (let i = 0; i < layerCount; i++) {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-config-item';
        layerDiv.innerHTML = `
            <div class="layer-config-header">
                <h4>Capa ${i + 1}</h4>
                ${i > 0 ? `<button type="button" class="remove-layer-btn" onclick="removeLayer(${i})">×</button>` : ''}
            </div>
            <div class="layer-config-content">
                
                <div class="layer-image-upload">
                    <label for="layerImage_${i}">Imagen inicial (opcional):</label>
                    <input type="file" id="layerImage_${i}" name="layerImage_${i}" accept="image/*" onchange="handleLayerImageUpload(${i}, this)">
                    <div class="layer-image-preview" id="layerPreview_${i}">
                        <div class="layer-image-placeholder">
                            <span>Sin imagen - Fondo negro</span>
                        </div>
                    </div>
                </div>
                
                <div class="layer-controls">
                    <div class="layer-control-group">
                        <label for="layerOpacity_${i}">Opacidad:</label>
                        <input type="range" id="layerOpacity_${i}" name="layerOpacity_${i}" min="0" max="100" value="100" oninput="updateOpacityDisplay(${i}, this.value)">
                        <span class="opacity-display" id="opacityDisplay_${i}">100%</span>
                    </div>
                    
                    <div class="layer-control-group">
                        <label>
                            <input type="checkbox" id="layerVisible_${i}" name="layerVisible_${i}" checked>
                            Visible
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        layersConfigDiv.appendChild(layerDiv);
    }
}

function handleLayerImageUpload(layerIndex, input) {
    const file = input.files[0];
    const previewDiv = document.getElementById(`layerPreview_${layerIndex}`);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 150px;">
                <button type="button" class="remove-image-btn" onclick="removeLayerImage(${layerIndex})">Quitar imagen</button>
            `;
            
            // Store the image data for later use
            previewDiv.dataset.imageData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function removeLayerImage(layerIndex) {
    const previewDiv = document.getElementById(`layerPreview_${layerIndex}`);
    const fileInput = document.getElementById(`layerImage_${layerIndex}`);
    
    previewDiv.innerHTML = `
        <div class="layer-image-placeholder">
            <span>Sin imagen - Fondo negro</span>
        </div>
    `;
    
    fileInput.value = '';
    delete previewDiv.dataset.imageData;
}

function removeLayer(layerIndex) {
    const layerCountInput = document.getElementById('layerCount');
    const currentCount = parseInt(layerCountInput.value);
    
    if (currentCount > 1) {
        layerCountInput.value = currentCount - 1;
        generateLayerConfiguration(currentCount - 1);
    }
}

function updateOpacityDisplay(layerIndex, value) {
    const display = document.getElementById(`opacityDisplay_${layerIndex}`);
    if (display) {
        display.textContent = `${value}%`;
    }
}

function collectLayerConfiguration() {
    const layerCount = parseInt(document.getElementById('layerCount').value) || 1;
    const layers = [];
    
    for (let i = 0; i < layerCount; i++) {
        const opacityInput = document.getElementById(`layerOpacity_${i}`);
        const visibleInput = document.getElementById(`layerVisible_${i}`);
        const previewDiv = document.getElementById(`layerPreview_${i}`);
        
        const layer = {
            layerIndex: i,
            name: '',
            imageData: previewDiv && previewDiv.dataset.imageData ? previewDiv.dataset.imageData : null,
            // Convertir 0-100% a 0-1 para cumplir con el esquema del backend
            opacity: opacityInput ? Math.max(0, Math.min(100, parseInt(opacityInput.value))) / 100 : 1.0,
            visible: visibleInput ? visibleInput.checked : true
        };
        
        layers.push(layer);
    }
    
    return layers;
}

// ========== DEFAULT IMAGE BRUSH FUNCTIONS ==========

function setupDefaultImageBrush() {
    const container = document.getElementById('defaultImagesContainer');
    
    if (container) {
        container.style.display = 'block';
    }
}

function addDefaultImage() {
    // Mantener compatibilidad, pero ahora preferimos pickAndAddDefaultImage()
    pickAndAddDefaultImage();
}

function addDefaultImageWithData(imageData) {
    const imagesList = document.getElementById('defaultImagesList');
    const imageIndex = imagesList.children.length;
    
    const imageDiv = document.createElement('div');
    imageDiv.className = 'default-image-item';
    imageDiv.style.cssText = 'position: relative; background: white; border: 1px solid #ddd; border-radius: 8px; padding: 8px;';
    
    imageDiv.innerHTML = `
        <div id="defaultImagePreview_${imageIndex}" style="text-align: center;">
            <img src="${imageData}" style="width: 100%; max-width: 100px; max-height: 100px; border-radius: 6px; border: 1px solid #eee;" />
        </div>
        <button type="button" onclick="removeDefaultImage(${imageIndex})" title="Eliminar" style="position: absolute; top: 6px; right: 6px; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 50%; cursor: pointer; line-height: 1;">✖</button>
    `;
    
    imagesList.appendChild(imageDiv);
    const previewDiv = document.getElementById(`defaultImagePreview_${imageIndex}`);
    if (previewDiv) {
        previewDiv.dataset.imageData = imageData;
    }
}

function pickAndAddDefaultImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.addEventListener('change', async () => {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen es demasiado grande. Máximo 5MB.');
                document.body.removeChild(input);
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = () => {
                    const targetSize = 50;
                    const canvas = document.createElement('canvas');
                    canvas.width = targetSize;
                    canvas.height = targetSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, targetSize, targetSize);
                    const resizedData = canvas.toDataURL('image/png');
                    addDefaultImageWithData(resizedData);
                    document.body.removeChild(input);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            document.body.removeChild(input);
        }
    });
    input.click();
}

function removeDefaultImage(imageIndex) {
    const imagesList = document.getElementById('defaultImagesList');
    const imageItem = imagesList.children[imageIndex];
    if (imageItem) {
        imageItem.remove();
        // Re-index remaining items
        Array.from(imagesList.children).forEach((item, index) => {
            updateDefaultImageIndexes(item, index);
        });
    }
}

function updateDefaultImageIndexes(item, newIndex) {
    // Update all IDs and onclick handlers in the item
    const elements = item.querySelectorAll('[id*="_"], [onclick*="("]');
    elements.forEach(el => {
        if (el.id) {
            el.id = el.id.replace(/_\d+$/, `_${newIndex}`);
        }
        if (el.onclick) {
            el.onclick = el.onclick.toString().replace(/\(\d+\)/, `(${newIndex})`);
        }
    });
    
    // Update the title
    const title = item.querySelector('h4');
    if (title) {
        title.textContent = `Imagen ${newIndex + 1}`;
    }
}

async function previewDefaultImage(imageIndex) {
    const fileInput = document.getElementById(`defaultImageFile_${imageIndex}`);
    const previewDiv = document.getElementById(`defaultImagePreview_${imageIndex}`);
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        
        // Validar tamaño de archivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande. Máximo 5MB.');
            fileInput.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = () => {
                // Redimensionar a 50x50 como el algoritmo del brush
                const targetSize = 50;
                const canvas = document.createElement('canvas');
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, targetSize, targetSize);
                const resizedData = canvas.toDataURL('image/png');
                
                previewDiv.innerHTML = `
                    <img src="${resizedData}" style="max-width: 200px; max-height: 150px; border: 1px solid #ddd; border-radius: 4px;">
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
                        Redimensionada a 50x50
                    </p>
                `;
                
                // Guardar la imagen redimensionada
                previewDiv.dataset.imageData = resizedData;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        previewDiv.innerHTML = '';
        delete previewDiv.dataset.imageData;
    }
}

function collectDefaultImageBrushConfiguration() {
    // El estado enabled depende de si hay imágenes: si hay 0, no se guarda nada.
    const imagesList = document.getElementById('defaultImagesList');
    const images = [];
    
    Array.from(imagesList.children).forEach((item, index) => {
        const previewDiv = document.getElementById(`defaultImagePreview_${index}`);
        if (previewDiv && previewDiv.dataset.imageData) {
            images.push({ imageData: previewDiv.dataset.imageData });
        }
    });
    
    const enabled = images.length > 0;
    return { enabled, images };
}

window.editSession = editSession;
window.deleteSession = deleteSession;
window.openCreateSessionModal = openCreateSessionModal;
window.closeSessionModal = closeSessionModal;
window.saveSession = saveSession;
window.toggleBrushTypeForUser = toggleBrushTypeForUser;
window.removeBackgroundImage = removeBackgroundImage;
window.removeLogoImage = removeLogoImage;
window.setupLayerConfiguration = setupLayerConfiguration;
window.generateLayerConfiguration = generateLayerConfiguration;
window.handleLayerImageUpload = handleLayerImageUpload;
window.removeLayerImage = removeLayerImage;
window.removeLayer = removeLayer;
window.updateOpacityDisplay = updateOpacityDisplay;
window.collectLayerConfiguration = collectLayerConfiguration;
window.setupDefaultImageBrush = setupDefaultImageBrush;
window.addDefaultImage = addDefaultImage;
window.addDefaultImageWithData = addDefaultImageWithData;
window.pickAndAddDefaultImage = pickAndAddDefaultImage;
window.removeDefaultImage = removeDefaultImage;
window.previewDefaultImage = previewDefaultImage;
window.collectDefaultImageBrushConfiguration = collectDefaultImageBrushConfiguration;

// Initialize
initializeSocket();
checkAuth();
