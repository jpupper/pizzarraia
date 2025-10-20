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
                    // Apply brush restrictions if configured
                    if (data.session.allowedBrushTypes && data.session.allowedBrushTypes.length > 0) {
                        console.log(`🔒 Aplicando restricciones de brushes:`, data.session.allowedBrushTypes);
                        brushRegistry.setAllowedBrushTypes(data.session.allowedBrushTypes);
                        console.log(`✓ Brushes permitidos: ${data.session.allowedBrushTypes.join(', ')}`);
                        console.log(`✓ Total de brushes registrados: ${brushRegistry.getAllIds().length}`);
                        console.log(`✓ Brushes que se mostrarán: ${brushRegistry.getAllowedBrushes().length}`);
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
 * Fuerza el ocultamiento de botones no permitidos
 * Esta función se ejecuta como medida de seguridad adicional
 */
function forceHideNonAllowedButtons() {
    if (!brushRegistry) {
        console.warn('⚠️ forceHideNonAllowedButtons: BrushRegistry no disponible');
        return;
    }

    console.log('🔒 forceHideNonAllowedButtons: Ocultando botones no permitidos...');
    
    // Obtener TODOS los botones del DOM
    const allButtons = document.querySelectorAll('.brush-btn');
    console.log(`📊 Total de botones encontrados en el DOM: ${allButtons.length}`);
    
    if (allButtons.length === 0) {
        console.warn('⚠️ No se encontraron botones .brush-btn en el DOM');
        return;
    }
    
    let hiddenCount = 0;
    let visibleCount = 0;
    
    allButtons.forEach(button => {
        const brushId = button.getAttribute('data-brush');
        
        if (brushId) {
            const isAllowed = brushRegistry.isBrushAllowed(brushId);
            
            if (isAllowed) {
                // Asegurar que el botón esté visible
                button.style.display = '';
                button.style.visibility = 'visible';
                button.style.opacity = '1';
                visibleCount++;
                console.log(`✅ Brush visible: ${brushId}`);
            } else {
                // OCULTAR COMPLETAMENTE
                button.style.display = 'none';
                button.style.visibility = 'hidden';
                button.style.opacity = '0';
                button.style.pointerEvents = 'none';
                hiddenCount++;
                console.log(`🚫 Brush OCULTO: ${brushId}`);
            }
        }
    });
    
    console.log(`✅ forceHideNonAllowedButtons completado:`);
    console.log(`   - Botones visibles: ${visibleCount}`);
    console.log(`   - Botones ocultos: ${hiddenCount}`);
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
