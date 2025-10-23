/**
 * updateSessionDraw.js
 * Centraliza TODA la lógica de actualización de sesión en tiempo real
 * Maneja: colores, brushes, restricciones, logo, nombre, descripción
 */

/**
 * Maneja la actualización de configuración de sesión en tiempo real
 * @param {Object} data - Datos de la sesión actualizada
 */
async function handleSessionUpdate(data) {
    console.log('🔄 [UPDATE] handleSessionUpdate() INICIADO');
    console.log('📊 [UPDATE] Sesión actual:', sessionId);
    console.log('📊 [UPDATE] Sesión recibida:', data.sessionId);
    
    // Validar sesión
    if (data.sessionId !== sessionId) {
        console.log('⚠️ [UPDATE] Sesión diferente, IGNORANDO');
        return;
    }
    
    console.log('✅ [UPDATE] Sesión coincide - Continuando...');
    
    // Notificación
    if (typeof toast !== 'undefined') {
        toast.info('⚡ Configuración actualizada');
    }
    
    // 1. Aplicar colores personalizados
    await updateSessionColors(data);
    
    // 2. Aplicar configuración de acceso (brushes y restricciones)
    await updateAccessConfig(data);
    
    // 3. Actualizar información visual (nombre, descripción, logo)
    updateSessionInfo(data);
    
    console.log('✅ [UPDATE] ========== ACTUALIZACIÓN COMPLETADA ==========\n');
}

/**
 * Actualiza los colores de la sesión
 * @param {Object} data - Datos de la sesión
 */
async function updateSessionColors(data) {
    console.log('🔍 [UPDATE] Verificando colores...');
    console.log('🔍 [UPDATE] data.accessConfig.colors existe?', !!(data.accessConfig?.colors));
    
    if (data.accessConfig && data.accessConfig.colors) {
        console.log('✅ [UPDATE] APLICANDO COLORES:', data.accessConfig.colors);
        // Llamar a applySessionColors que está en sketch.js
        if (typeof applySessionColors === 'function') {
            applySessionColors(data.accessConfig.colors);
        } else {
            console.error('❌ [UPDATE] applySessionColors no disponible');
        }
    } else {
        console.log('⚠️ [UPDATE] No hay colores personalizados, usando defaults');
    }
}

/**
 * Actualiza la configuración de acceso (brushes y restricciones)
 * @param {Object} data - Datos de la sesión
 */
async function updateAccessConfig(data) {
    // Validar que existe accessConfig
    if (!data.accessConfig || typeof applyAccessConfig !== 'function') {
        console.warn('⚠️ [UPDATE] No hay accessConfig o applyAccessConfig');
        return;
    }
    
    try {
        console.log('👤 [UPDATE] Determinando tipo de usuario...');
        
        // Determinar tipo de usuario
        let userType = 'notLogged';
        let currentUsername = null;
        
        const response = await fetch(`${config.API_URL}/api/check-session`, {
            headers: config.getAuthHeaders()
        });
        const authData = await response.json();
        
        if (authData.authenticated) {
            currentUsername = authData.user?.username;
            userType = 'logged';
        }
        
        console.log('✅ [UPDATE] Usuario:', { tipo: userType, username: currentUsername });
        console.log('🔐 [UPDATE] Aplicando configuración de acceso...');
        
        // Aplicar configuración
        const allowedBrushes = await applyAccessConfig(data.accessConfig, userType, currentUsername);
        
        console.log('📋 [UPDATE] Brushes permitidos:', allowedBrushes);
        
        // Actualizar brushes permitidos
        updateAllowedBrushes(allowedBrushes);
        
        // Aplicar restricciones específicas
        applyUserRestrictions(data.accessConfig, userType);
        
    } catch (error) {
        console.error('❌ [UPDATE] Error en updateAccessConfig:', error);
        console.error('❌ [UPDATE] Stack:', error.stack);
    }
}

/**
 * Actualiza los brushes permitidos en el registry
 * @param {Array} allowedBrushes - Lista de brushes permitidos
 */
function updateAllowedBrushes(allowedBrushes) {
    if (allowedBrushes && typeof brushRegistry !== 'undefined') {
        console.log('🔒 [UPDATE] Actualizando BrushRegistry...');
        brushRegistry.setAllowedBrushTypes(allowedBrushes);
        
        console.log('🔘 [UPDATE] Actualizando botones...');
        // Actualizar botones INMEDIATAMENTE
        if (typeof forceHideNonAllowedButtons === 'function') {
            forceHideNonAllowedButtons();
        } else {
            console.error('❌ [UPDATE] forceHideNonAllowedButtons NO disponible');
        }
        
        // Cambiar brush si el actual no está permitido
        if (typeof currentBrush !== 'undefined' && !allowedBrushes.includes(currentBrush)) {
            console.log('⚠️ [UPDATE] Brush actual no permitido, cambiando...');
            if (allowedBrushes.length > 0 && typeof selectBrush === 'function') {
                selectBrush(allowedBrushes[0]);
            }
        }
    } else {
        console.error('❌ [UPDATE] No se recibieron brushes o BrushRegistry no disponible');
    }
}

/**
 * Aplica restricciones específicas del usuario
 * @param {Object} accessConfig - Configuración de acceso
 * @param {String} userType - Tipo de usuario ('logged' o 'notLogged')
 */
function applyUserRestrictions(accessConfig, userType) {
    const userConfigKey = userType === 'logged' ? 'logged' : 'notLogged';
    const userConfig = accessConfig[userConfigKey];
    
    console.log('🔐 [UPDATE] Aplicando restricciones para:', userConfigKey);
    
    if (userConfig && userConfig.restrictions && typeof applySessionRestrictions === 'function') {
        applySessionRestrictions(userConfig.restrictions);
        console.log('✅ [UPDATE] Restricciones aplicadas');
    }
}

/**
 * Actualiza la información visual de la sesión (nombre, descripción, logo)
 * @param {Object} data - Datos de la sesión
 */
function updateSessionInfo(data) {
    // Actualizar nombre y descripción
    updateSessionNameAndDescription(data);
    
    // Actualizar logo
    updateSessionLogo(data);
}

/**
 * Actualiza el nombre y descripción de la sesión
 * @param {Object} data - Datos de la sesión
 */
function updateSessionNameAndDescription(data) {
    if (data.name || data.description) {
        console.log('📝 [UPDATE] Actualizando nombre y descripción de sesión...');
        
        // Actualizar nombre
        if (data.name) {
            const nameElement = document.getElementById('sessionBrandingName');
            if (nameElement) {
                nameElement.textContent = data.name;
                console.log('✅ [UPDATE] Nombre actualizado:', data.name);
            } else {
                console.warn('⚠️ [UPDATE] Elemento #sessionBrandingName no encontrado');
            }
        }
        
        // Actualizar descripción
        if (data.description) {
            const descElement = document.getElementById('sessionBrandingDescription');
            if (descElement) {
                descElement.textContent = data.description;
                console.log('✅ [UPDATE] Descripción actualizada:', data.description);
            } else {
                console.warn('⚠️ [UPDATE] Elemento #sessionBrandingDescription no encontrado');
            }
        }
    }
}

/**
 * Actualiza el logo de la sesión
 * @param {Object} data - Datos de la sesión
 */
function updateSessionLogo(data) {
    if (data.customization && data.customization.logoImage) {
        const brandingContainer = document.getElementById('sessionBrandingLogo');
        if (brandingContainer) {
            brandingContainer.innerHTML = `<img src="${data.customization.logoImage}" alt="Logo de sesión">`;
            brandingContainer.style.display = 'block';
            console.log('✅ [UPDATE] Logo actualizado');
        } else {
            console.warn('⚠️ [UPDATE] Elemento #sessionBrandingLogo no encontrado');
        }
    }
}

// Exportar funciones globalmente
window.handleSessionUpdate = handleSessionUpdate;
window.updateSessionColors = updateSessionColors;
window.updateAccessConfig = updateAccessConfig;
window.updateSessionInfo = updateSessionInfo;
window.updateSessionLogo = updateSessionLogo;
window.updateSessionNameAndDescription = updateSessionNameAndDescription;
