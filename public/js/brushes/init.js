/**
 * Inicialización del sistema de brushes
 * Este archivo se encarga de:
 * 1. Inicializar el registro de brushes
 * 2. Renderizar los botones dinámicamente
 * 3. Renderizar los controles dinámicamente
 * 4. Configurar el brush por defecto
 */

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎨 Inicializando sistema de brushes...');
    
    // Verificar que el registro existe
    if (typeof brushRegistry === 'undefined') {
        console.error('❌ BrushRegistry no está disponible');
        return;
    }

    // Get session ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session') || urlParams.get('sesion');
    
    // Fetch session configuration BEFORE rendering buttons
    if (sessionId && typeof config !== 'undefined') {
        try {
            console.log(`🔍 Cargando configuración de sesión ${sessionId}...`);
            const response = await fetch(`${config.API_URL}/api/sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.session) {
                    // Determinar el tipo de usuario actual
                    let userType = 'notLogged'; // Por defecto
                    let currentUsername = null;
                    
                    try {
                        const authResponse = await fetch(`${config.API_URL}/api/check-session`, {
                            headers: config.getAuthHeaders()
                        });
                        const authData = await authResponse.json();
                        if (authData.authenticated) {
                            currentUsername = authData.user?.username;
                            userType = 'logged';
                        }
                    } catch (error) {
                        console.warn('No se pudo verificar autenticación:', error);
                    }
                    
                    // Aplicar configuración de acceso según tipo de usuario
                    if (data.session.accessConfig) {
                        const allowedBrushes = await applyAccessConfig(data.session.accessConfig, userType, currentUsername);
                        
                        if (allowedBrushes) {
                            console.log(`🔒 Aplicando restricciones para ${userType}:`, allowedBrushes);
                            brushRegistry.setAllowedBrushTypes(allowedBrushes);
                            console.log(`✓ Brushes permitidos: ${allowedBrushes.join(', ')}`);
                            console.log(`✓ Total de brushes registrados: ${brushRegistry.getAllIds().length}`);
                            console.log(`✓ Brushes que se mostrarán: ${brushRegistry.getAllowedBrushes().length}`);
                            
                            // Aplicar restricciones específicas del tipo de usuario
                            const userConfig = data.session.accessConfig[userType];
                            if (userConfig && userConfig.restrictions) {
                                console.log(`🔒 Aplicando restricciones específicas para ${userType}:`, userConfig.restrictions);
                                applySessionRestrictions(userConfig.restrictions);
                            }
                        }
                    } else if (data.session.allowedBrushTypes && data.session.allowedBrushTypes.length > 0) {
                        // Compatibilidad con formato antiguo
                        console.log(`🔒 Aplicando restricciones (formato antiguo):`, data.session.allowedBrushTypes);
                        brushRegistry.setAllowedBrushTypes(data.session.allowedBrushTypes);
                        
                        // Apply additional restrictions (formato antiguo)
                        if (data.session.restrictions) {
                            applySessionRestrictions(data.session.restrictions);
                        }
                    } else {
                        console.log(`ℹ️ Sesión ${sessionId} sin restricciones - todos los brushes disponibles`);
                    }
                } else {
                    // Session not found in database
                    console.error(`❌ La sesión ${sessionId} no existe`);
                    window.location.href = `session-not-found.html?session=${sessionId}`;
                    return;
                }
            } else if (response.status === 404) {
                // Session not found
                console.error(`❌ La sesión ${sessionId} no existe`);
                window.location.href = `session-not-found.html?session=${sessionId}`;
                return;
            }
        } catch (error) {
            console.warn('⚠ No se pudo cargar la configuración de la sesión:', error);
        }
    } else {
        console.log(`ℹ️ Sin ID de sesión - todos los brushes disponibles`);
    }

    // NOW render buttons AFTER restrictions have been applied
    const brushButtonsContainer = document.querySelector('.brush-buttons');
    if (brushButtonsContainer) {
        brushButtonsContainer.id = 'brushButtons';
        console.log(`🎨 Renderizando botones de brushes...`);
        brushRegistry.renderButtons('brushButtons');
        const allowedCount = brushRegistry.getAllowedBrushes().length;
        const totalCount = brushRegistry.getAllIds().length;
        console.log(`✓ ${allowedCount} de ${totalCount} botones de brushes renderizados`);
        
        // Log which brushes are shown
        const allowedBrushes = brushRegistry.getAllowedBrushes();
        console.log(`📋 Brushes visibles:`, allowedBrushes.map(b => b.getId()).join(', '));
        
        // FORZAR ocultamiento de botones no permitidos después de un pequeño delay
        setTimeout(() => {
            forceHideNonAllowedButtons();
        }, 100);
    } else {
        console.warn('⚠ Contenedor de botones de brushes no encontrado');
    }

    // Crear contenedor para controles si no existe
    let controlsContainer = document.getElementById('brushControls');
    if (!controlsContainer) {
        // Buscar donde insertar los controles (después de los controles globales)
        const guiElement = document.getElementById('gui');
        if (guiElement) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'brushControls';
            guiElement.appendChild(controlsContainer);
        }
    }

    // Renderizar controles de brushes
    if (controlsContainer) {
        brushRegistry.renderControls('brushControls');
        console.log('✓ Controles de brushes renderizados');
    }

    // Establecer brush por defecto (classic/standard) si está permitido
    let defaultBrush = 'classic';
    const allowedBrushes = brushRegistry.getAllowedBrushes();
    
    if (allowedBrushes.length > 0) {
        // Si classic no está permitido, usar el primer brush permitido
        if (!brushRegistry.isBrushAllowed(defaultBrush)) {
            defaultBrush = allowedBrushes[0].getId();
        }
        
        if (brushRegistry.has(defaultBrush)) {
            brushRegistry.setActive(defaultBrush);
            
            // Marcar el botón como activo
            const defaultButton = document.querySelector(`[data-brush="${defaultBrush}"]`);
            if (defaultButton) {
                defaultButton.classList.add('active');
            }
            
            console.log(`✓ Brush por defecto establecido: ${defaultBrush}`);
        }
    }

    console.log('✅ Sistema de brushes inicializado correctamente');
    console.log(`📊 Brushes registrados: ${brushRegistry.getAllIds().join(', ')}`);
});

/**
 * Aplica la configuración de acceso según el tipo de usuario
 * @param {Object} accessConfig - Configuración de acceso
 * @param {string} userType - Tipo de usuario ('notLogged', 'logged', 'specific')
 * @param {string} currentUsername - Nombre del usuario actual (si está logueado)
 * @returns {Array|null} - Array de brushes permitidos o null si no tiene acceso
 */
async function applyAccessConfig(accessConfig, userType, currentUsername) {
    console.log('🔐 Aplicando configuración de acceso:', { accessConfig, userType, currentUsername });
    
    // Verificar si es un usuario específico
    if (currentUsername && accessConfig.specific?.allowed) {
        const isSpecificUser = accessConfig.specific.users.includes(currentUsername);
        if (isSpecificUser) {
            console.log(`✅ Usuario específico detectado: ${currentUsername}`);
            if (!accessConfig.specific.brushes || accessConfig.specific.brushes.length === 0) {
                alert('⛔ Esta sesión no tiene herramientas configuradas para usuarios específicos.');
                window.location.href = 'index.html';
                return null;
            }
            return accessConfig.specific.brushes;
        }
    }
    
    // Verificar según tipo de usuario
    if (userType === 'logged') {
        if (!accessConfig.logged?.allowed) {
            alert('⛔ Esta sesión no permite el acceso a usuarios registrados.\n\nPor favor, cierra sesión para continuar.');
            return null;
        }
        if (!accessConfig.logged.brushes || accessConfig.logged.brushes.length === 0) {
            alert('⛔ Esta sesión no tiene herramientas configuradas para usuarios registrados.');
            window.location.href = 'index.html';
            return null;
        }
        console.log(`✅ Acceso permitido para usuario registrado`);
        return accessConfig.logged.brushes;
    }
    
    if (userType === 'notLogged') {
        if (!accessConfig.notLogged?.allowed) {
            alert('⛔ Esta sesión solo está disponible para usuarios registrados.\n\nPor favor, inicia sesión para continuar.');
            window.location.href = 'login.html';
            return null;
        }
        if (!accessConfig.notLogged.brushes || accessConfig.notLogged.brushes.length === 0) {
            alert('⛔ Esta sesión no tiene herramientas configuradas para usuarios no registrados.');
            window.location.href = 'index.html';
            return null;
        }
        console.log(`✅ Acceso permitido para usuario no registrado`);
        return accessConfig.notLogged.brushes;
    }
    
    // Por defecto, denegar acceso
    alert('⛔ No tienes permiso para acceder a esta sesión.');
    window.location.href = 'index.html';
    return null;
}

/**
 * Aplica restricciones adicionales de la sesión
 * @param {Object} restrictions - Objeto con las restricciones
 */
function applySessionRestrictions(restrictions) {
    console.log('🔒 Aplicando restricciones adicionales:', restrictions);
    
    // Restricción de Kaleidoscopio
    if (restrictions.allowKaleidoscope === false) {
        console.log('🚫 Kaleidoscopio deshabilitado');
        const kaleidoSlider = document.getElementById('kaleidoSegments');
        if (kaleidoSlider) {
            kaleidoSlider.disabled = true;
            kaleidoSlider.value = 1;
            kaleidoSlider.style.opacity = '0.5';
            kaleidoSlider.style.cursor = 'not-allowed';
            
            // Actualizar el valor mostrado
            const valueSpan = document.getElementById('kaleidoSegments-value');
            if (valueSpan) valueSpan.textContent = '1';
            
            // Agregar tooltip
            kaleidoSlider.title = 'Kaleidoscopio deshabilitado en esta sesión';
        }
        
        // Ocultar el label también
        const kaleidoLabel = document.querySelector('label[for="kaleidoSegments"]');
        if (kaleidoLabel) {
            kaleidoLabel.style.opacity = '0.5';
        }
    }
    
    // Restricción de Capas
    if (restrictions.allowLayers === false) {
        console.log('🚫 Capas deshabilitadas');
        
        // Deshabilitar botones de capas si existen
        const layerButtons = document.querySelectorAll('.layer-btn, [data-layer]');
        layerButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Capas deshabilitadas en esta sesión';
        });
        
        // Ocultar controles de capas
        const layerControls = document.querySelectorAll('.layer-control, #layerSelector');
        layerControls.forEach(ctrl => {
            ctrl.style.display = 'none';
        });
        
        // Forzar a usar solo capa 0
        if (typeof window.currentLayer !== 'undefined') {
            window.currentLayer = 0;
        }
    }
    
    // Guardar restricciones globalmente para referencia futura
    window.sessionRestrictions = restrictions;
}

/**
 * Fuerza el ocultamiento de botones no permitidos
 * NUEVO: Usa el sistema polimórfico de cada brush
 */
function forceHideNonAllowedButtons() {
    if (!brushRegistry) {
        console.warn('⚠️ forceHideNonAllowedButtons: BrushRegistry no disponible');
        return;
    }

    console.log('🔒 forceHideNonAllowedButtons: Actualizando visibilidad de brushes...');
    
    const allBrushIds = brushRegistry.getAllIds();
    console.log(`📊 Total de brushes registrados: ${allBrushIds.length}`);
    
    let hiddenCount = 0;
    let visibleCount = 0;
    
    // POLIMORFISMO: Cada brush controla su propia visibilidad
    allBrushIds.forEach(brushId => {
        const brush = brushRegistry.get(brushId);
        const isAllowed = brushRegistry.isBrushAllowed(brushId);
        
        if (brush && typeof brush.setVisible === 'function') {
            // Usar el método polimórfico del brush
            brush.setVisible(isAllowed, isAllowed ? null : 'No permitido en esta sesión');
            
            if (isAllowed) {
                visibleCount++;
            } else {
                hiddenCount++;
            }
        } else {
            // Fallback al método antiguo si el brush no tiene el nuevo sistema
            console.warn(`⚠️ Brush ${brushId} no tiene método setVisible(), usando fallback`);
            const button = document.querySelector(`.brush-btn[data-brush="${brushId}"]`);
            if (button) {
                if (isAllowed) {
                    button.style.display = '';
                    button.style.visibility = 'visible';
                    button.style.opacity = '1';
                    visibleCount++;
                } else {
                    button.style.display = 'none';
                    button.style.visibility = 'hidden';
                    button.style.opacity = '0';
                    button.style.pointerEvents = 'none';
                    hiddenCount++;
                }
            }
        }
    });
    
    console.log(`✅ forceHideNonAllowedButtons completado:`);
    console.log(`   - Brushes visibles: ${visibleCount}`);
    console.log(`   - Brushes ocultos: ${hiddenCount}`);
}

/**
 * Función helper para obtener el brush activo
 * @returns {BaseBrush|null}
 */
function getActiveBrush() {
    return brushRegistry ? brushRegistry.getActive() : null;
}

/**
 * Función helper para obtener parámetros actuales del brush
 * @returns {Object}
 */
function getCurrentBrushParams() {
    const params = {
        size: parseInt(document.getElementById('size')?.value || 10),
        alpha: parseInt(document.getElementById('av')?.value || 255),
        kaleidoSegments: parseInt(document.getElementById('kaleidoSegments')?.value || 1)
    };

    // Obtener color
    const colorInput = document.getElementById('c1');
    if (colorInput && typeof color !== 'undefined') {
        params.color = color(colorInput.value);
    }

    // Agregar parámetros específicos según el brush activo
    const activeBrush = getActiveBrush();
    if (activeBrush) {
        const brushId = activeBrush.getId();
        
        // Parámetros específicos por brush
        switch(brushId) {
            case 'pixel':
                params.cols = parseInt(document.getElementById('gridCols')?.value || 32);
                params.rows = parseInt(document.getElementById('gridRows')?.value || 32);
                break;
            case 'art':
                params.particleCount = parseInt(document.getElementById('particleCount')?.value || 10);
                params.speedForce = parseFloat(document.getElementById('speedForce')?.value || 0.5);
                params.maxSpeed = parseFloat(document.getElementById('maxSpeed')?.value || 0.5);
                params.particleLife = parseInt(document.getElementById('particleLife')?.value || 255);
                params.particleMaxSize = parseInt(document.getElementById('particleMaxSize')?.value || 10);
                break;
            case 'text':
                params.textContent = document.getElementById('textContent')?.value || 'TEXTO';
                params.textSize = parseInt(document.getElementById('textSize')?.value || 40);
                params.textFont = document.getElementById('textFont')?.value || 'Arial';
                break;
            case 'geometry':
                params.polygonSides = parseInt(document.getElementById('polygonSides')?.value || 5);
                break;
            case 'fill':
                params.fillTolerance = parseInt(document.getElementById('fillTolerance')?.value || 0);
                break;
            case 'image':
                const imageBrushMgr = typeof getImageBrushManager !== 'undefined' ? getImageBrushManager() : null;
                if (imageBrushMgr && imageBrushMgr.hasImage()) {
                    params.imageData = imageBrushMgr.getImageData();
                }
                break;
        }
    }

    return params;
}

// Hacer funciones disponibles globalmente
if (typeof window !== 'undefined') {
    window.getActiveBrush = getActiveBrush;
    window.getCurrentBrushParams = getCurrentBrushParams;
    window.forceHideNonAllowedButtons = forceHideNonAllowedButtons;
}
