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
    { id: 'allowLayers', name: '📚 Capas', icon: '📚' }
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
                    <button onclick="editSession('${session._id}')" class="btn btn-secondary btn-small">✏️ Editar</button>
                    <button onclick="deleteSession('${session._id}')" class="btn btn-danger btn-small">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

function openCreateSessionModal() {
    const modal = document.getElementById('sessionModal');
    document.getElementById('sessionModalTitle').textContent = 'Crear Nueva Sesión';
    document.getElementById('sessionForm').reset();
    
    // Generar ID de sesión automáticamente (15 dígitos)
    const sessionId = generateSessionId();
    document.getElementById('sessionIdInput').value = sessionId;
    
    // Populate brush types for each user type
    populateBrushTypesForAllUsers();
    
    // Setup access control listeners
    setupAccessControlListeners();
    
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
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    
    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }
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
        const notLoggedBrushes = Array.from(document.querySelectorAll('#notLoggedBrushes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        accessConfig.notLogged = {
            allowed: true,
            brushes: notLoggedBrushes
        };
    } else {
        accessConfig.notLogged = {
            allowed: false,
            brushes: []
        };
    }
    
    // Usuarios registrados
    const allowLogged = document.getElementById('allowLogged').checked;
    if (allowLogged) {
        const loggedBrushes = Array.from(document.querySelectorAll('#loggedBrushes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        accessConfig.logged = {
            allowed: true,
            brushes: loggedBrushes
        };
    } else {
        accessConfig.logged = {
            allowed: false,
            brushes: []
        };
    }
    
    // Usuarios específicos
    const allowSpecific = document.getElementById('allowSpecific').checked;
    if (allowSpecific) {
        const specificUsers = document.getElementById('specificUsers').value
            .split(',')
            .map(u => u.trim())
            .filter(u => u.length > 0);
        const specificBrushes = Array.from(document.querySelectorAll('#specificBrushes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        if (specificUsers.length === 0) {
            if (typeof toast !== 'undefined') {
                toast.error('Debes especificar al menos un usuario para "Usuarios Específicos"');
            } else {
                alert('Debes especificar al menos un usuario para "Usuarios Específicos"');
            }
            return;
        }
        
        accessConfig.specific = {
            allowed: true,
            users: specificUsers,
            brushes: specificBrushes
        };
    } else {
        accessConfig.specific = {
            allowed: false,
            users: [],
            brushes: []
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
    
    // Get additional restrictions
    const allowKaleidoscope = document.getElementById('allowKaleidoscope').checked;
    const allowLayers = document.getElementById('allowLayers').checked;
    
    // Verificar si estamos en modo edición
    const modal = document.getElementById('sessionModal');
    const isEditing = modal.dataset.editingMode === 'true';
    const editingSessionId = modal.dataset.editingSessionId;
    
    try {
        const url = isEditing 
            ? `${config.API_URL}/api/sessions/${editingSessionId}`
            : `${config.API_URL}/api/sessions/create`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...config.getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId,
                name,
                description,
                isPublic,
                accessConfig: accessConfig,
                restrictions: {
                    allowKaleidoscope,
                    allowLayers
                }
            })
        });
        
        const data = await response.json();
        
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
                    restrictions: {
                        allowKaleidoscope,
                        allowLayers
                    }
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
 */
function setupAutoSaveListeners() {
    console.log('⚙️ Configurando listeners de auto-guardado...');
    
    // NO clonar el modal - eso destruye todo
    // En su lugar, remover listeners específicos si es necesario
    
    // Listener para checkboxes de tipo de usuario
    document.querySelectorAll('.user-type-toggle').forEach(checkbox => {
        // Remover listener anterior si existe
        checkbox.removeEventListener('change', autoSaveSession);
        checkbox.addEventListener('change', autoSaveSession);
    });
    
    // Listener para checkboxes de brushes (incluyendo restricciones)
    document.querySelectorAll('.brush-types-grid input[type="checkbox"]').forEach(checkbox => {
        checkbox.removeEventListener('change', autoSaveSession);
        checkbox.addEventListener('change', autoSaveSession);
    });
    
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
    
    console.log('✅ Listeners configurados correctamente');
}

/**
 * Guarda automáticamente la sesión y envía por WebSocket - INMEDIATO
 */
async function autoSaveSession() {
    // Ejecutar guardado INMEDIATAMENTE
    await performAutoSave();
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
    
    try {
        // Recopilar configuración actual
        const sessionId = document.getElementById('sessionIdInput').value;
        const name = document.getElementById('sessionName').value;
        const description = document.getElementById('sessionDescription').value;
        const isPublic = document.getElementById('sessionIsPublic').checked;
        
        const accessConfig = {};
        
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
        
        // Guardar en backend
        const response = await fetch(`${config.API_URL}/api/sessions/${currentEditingSessionId}`, {
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
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Sesión guardada automáticamente');
            
            // Enviar por WebSocket para sincronización en tiempo real
            if (socket && socket.connected) {
                const updateData = {
                    sessionId: sessionId,
                    accessConfig: accessConfig,
                    name: name,
                    description: description
                };
                
                console.log('📡 Enviando actualización por WebSocket:');
                console.log('   - sessionId:', sessionId);
                console.log('   - accessConfig:', accessConfig);
                
                socket.emit('session-updated', updateData);
                console.log('✅ Configuración enviada por WebSocket');
            } else {
                console.error('❌ Socket no conectado, no se puede enviar actualización');
                console.log('   - socket existe:', !!socket);
                console.log('   - socket.connected:', socket?.connected);
            }
            
            // Actualizar sesión local
            currentEditingSession.accessConfig = accessConfig;
            currentEditingSession.name = name;
            currentEditingSession.description = description;
            currentEditingSession.isPublic = isPublic;
            
        } else {
            console.error('❌ Error al guardar:', data.message);
        }
    } catch (error) {
        console.error('❌ Error en auto-guardado:', error);
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

// Exponer funciones globalmente para que sean accesibles desde HTML
window.editSession = editSession;
window.deleteSession = deleteSession;
window.openCreateSessionModal = openCreateSessionModal;
window.closeSessionModal = closeSessionModal;
window.saveSession = saveSession;
window.toggleBrushTypeForUser = toggleBrushTypeForUser;

// Initialize
initializeSocket();
checkAuth();
