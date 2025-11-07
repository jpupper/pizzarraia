// Modo de juego: MaskMix (composición por shader)
// Activa con: ?gamemode=maskmix
// Mezcla capa1 y capa2 usando la capa máscara y un umbral configurable

(function(){
  // Estado interno del modo
  const state = {
    enabled: false,
    webglBuffer: null,
    shader: null,
    shaderReady: false,
    threshold: 0.9,
    visualizeMaskOnly: true,   // por defecto visualizar máscara
    autoswitch: true,          // si hay contenido en capa1/capa2, cambiar a mezcla automáticamente
    meterPosition: 'tr',       // posición del HUD: 'tl','tr','bl','br'
    // Índices por defecto: 1 = imagen A, 2 = imagen B, 3 = máscara
    layer1Index: 1,
    layer2Index: 2,
    maskIndex: 3,
    lastCoverage: 0,
    lastL1Coverage: 0,
    lastL2Coverage: 0,
    _sampleCanvas: null,
    _sampleCtx: null
  };

  function getUrlParam(name, defaultVal=null){
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has(name) ? urlParams.get(name) : defaultVal;
    } catch(e){ return defaultVal; }
  }

  function getBooleanUrlParam(name, defaultVal){
    const v = getUrlParam(name, null);
    if (v === null) return defaultVal;
    return v === 'true' || v === '1';
  }

  function getNumberUrlParam(name, defaultVal){
    const v = getUrlParam(name, null);
    if (v === null) return defaultVal;
    const n = parseFloat(v);
    return isNaN(n) ? defaultVal : n;
  }

  // Inicialización del modo
  function initMaskMixMode(){
    if (state.enabled) return;
    state.enabled = true;

    // Leer umbral de URL (maskthreshold o threshold)
    state.threshold = getNumberUrlParam('maskthreshold', getNumberUrlParam('threshold', 0.9));
    // Leer visualización y autoswitch
    state.visualizeMaskOnly = getBooleanUrlParam('visualize', true);
    state.autoswitch = getBooleanUrlParam('autoswitch', true);
    // Leer posición del HUD
    const mp = getUrlParam('meterpos', 'tr');
    if (mp === 'tl' || mp === 'tr' || mp === 'bl' || mp === 'br') state.meterPosition = mp;
    // Leer índices de capas por URL (layer1, layer2, mask)
    const l1 = parseInt(getUrlParam('layer1', state.layer1Index));
    const l2 = parseInt(getUrlParam('layer2', state.layer2Index));
    const lm = parseInt(getUrlParam('mask', state.maskIndex));
    if (!isNaN(l1)) state.layer1Index = l1;
    if (!isNaN(l2)) state.layer2Index = l2;
    if (!isNaN(lm)) state.maskIndex = lm;

    // Asegurar que existan al menos 3 capas para este modo (1=A, 2=B, 3=Máscara)
    // Si faltan, las creamos transparentes y las ocultamos en la UI normal
    const requiredMaxIndex = Math.max(state.layer1Index, state.layer2Index, state.maskIndex);
    while (window.layers.length <= requiredMaxIndex) {
      const g = createGraphics(windowWidth, windowHeight);
      g.clear(); // transparente
      window.layers.push(g);
      window.layerVisibility.push(false); // ocultas para el flujo normal
    }

    // Crear buffer WEBGL para aplicar el shader y componer
    if (typeof createGraphics === 'function') {
      state.webglBuffer = createGraphics(windowWidth, windowHeight, WEBGL);
      // Evitar que el rect se dibuje con stroke
      state.webglBuffer.noStroke();
    }

    // Cargar shader
    if (typeof loadShader === 'function') {
      // Usar rutas absolutas para evitar problemas de resolución en producción
      loadShader(
        // Rutas relativas al index.html actual (localhost)
        'shaders/maskmix.vert',
        'shaders/maskmix.frag',
        function(sh){
          state.shader = sh;
          state.shaderReady = true;
          console.log('[MaskMix] Shader cargado correctamente');
        },
        function(err){
          state.shaderReady = false;
          console.error('[MaskMix] Error cargando shader', err);
        }
      );
    }

    // Preparar canvas para muestreo rápido de cobertura
    state._sampleCanvas = document.createElement('canvas');
    state._sampleCanvas.width = 64;
    state._sampleCanvas.height = 64;
    state._sampleCtx = state._sampleCanvas.getContext('2d');

    // En este modo, forzar que el dibujo ocurra SOLO en la capa de máscara
    // para que no se siga dibujando sobre la capa 0.
    if (typeof window.setActiveLayer === 'function') {
      window.setActiveLayer(state.maskIndex);
    } else if (typeof window.activeLayer !== 'undefined') {
      window.activeLayer = state.maskIndex;
    }
    // Opcional: ocultar visualmente otras capas en la UI si existe esa función
    if (Array.isArray(window.layerVisibility)) {
      for (let i = 0; i < window.layerVisibility.length; i++) {
        window.layerVisibility[i] = (i === state.maskIndex);
      }
    }
    if (typeof window.updateLayerUI === 'function') {
      window.updateLayerUI();
    }

    console.log('[MaskMix] Modo inicializado. threshold=', state.threshold);
  }

  // Render del modo: devuelve un p5.Graphics con la mezcla
  function renderMaskMix(){
    if (!state.enabled || !state.webglBuffer || !state.shaderReady || !state.shader) {
      return null;
    }

    const tex1 = window.layers[state.layer1Index];
    const tex2 = window.layers[state.layer2Index];
    const mask = window.layers[state.maskIndex];

    // Si no hay las capas necesarias todavía, no dibujar nada (evita fondo negro)
    if (!tex1 || !tex2 || !mask) {
      return null;
    }

    state.webglBuffer.shader(state.shader);
    state.shader.setUniform('tex1', tex1);
    state.shader.setUniform('tex2', tex2);
    state.shader.setUniform('maskTex', mask);
    state.shader.setUniform('threshold', state.threshold);

    // Coberturas para decidir si mezclar o visualizar máscara
    state.lastCoverage = computeMaskCoveragePercent(mask);
    state.lastL1Coverage = computeLayerCoverage(tex1);
    state.lastL2Coverage = computeLayerCoverage(tex2);

    let visualize = state.visualizeMaskOnly ? 1.0 : 0.0;
    if (state.autoswitch) {
      const hasContentAB = (state.lastL1Coverage > 0.01) || (state.lastL2Coverage > 0.01);
      if (hasContentAB) visualize = 0.0; // mostrar mezcla
    }
    state.shader.setUniform('visualizeMaskOnly', visualize);

    // Dibujar un plano del tamaño del canvas para aplicar el shader a toda la superficie
    state.webglBuffer.push();
    state.webglBuffer.resetMatrix();
    state.webglBuffer.plane(windowWidth, windowHeight);
    state.webglBuffer.pop();

    // Actualizar cobertura ya calculada arriba

    return state.webglBuffer;
  }

  // Cálculo de cobertura de la máscara (alpha promedio) usando downscale
  function computeMaskCoveragePercent(maskGraphics){
    try {
      if (!maskGraphics || !maskGraphics.canvas) return 0;
      const sampleSize = 64;
      const ctx = state._sampleCtx;
      const canvas = state._sampleCanvas;
      // Limpiar
      ctx.clearRect(0,0,sampleSize,sampleSize);
      // Dibujar la máscara escalada
      ctx.drawImage(maskGraphics.canvas, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
      const data = imgData.data;
      let alphaSum = 0;
      for (let i=3; i<data.length; i+=4){
        alphaSum += data[i];
      }
      const maxAlpha = 255 * (canvas.width * canvas.height);
      const coverage = alphaSum / maxAlpha; // 0..1
      return coverage;
    } catch(e){
      return 0;
    }
  }

  // Cobertura para capas A/B (usando alpha o luminancia promedio)
  function computeLayerCoverage(gfx){
    try {
      if (!gfx || !gfx.canvas) return 0;
      const ctx = state._sampleCtx;
      const canvas = state._sampleCanvas;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(gfx.canvas, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0,0,canvas.width, canvas.height);
      const d = imgData.data;
      let sum = 0;
      for (let i=0; i<d.length; i+=4){
        // usar alpha y luminancia simple
        const lum = (0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]) / 255.0;
        const a = d[i+3] / 255.0;
        sum += Math.max(lum, a);
      }
      const max = (canvas.width * canvas.height);
      return sum / max; // 0..1
    } catch(e){ return 0; }
  }

  // Dibuja medidor de umbral/cobertura en el guiBuffer
  function drawThresholdMeter(guiBuffer){
    if (!state.enabled || !guiBuffer) return;
    const hasL1 = !!window.layers[state.layer1Index];
    const hasL2 = !!window.layers[state.layer2Index];
    const hasMask = !!window.layers[state.maskIndex];
    const percent = Math.round(state.lastCoverage * 100);
    const w = 160;
    const h = 16;
    let x = 12;
    let y = 12;
    // Posicionar según meterPosition evitando el botón de abrir GUI
    const gw = guiBuffer.width;
    const gh = guiBuffer.height;
    if (state.meterPosition === 'tr') { x = gw - w - 20; y = 12; }
    else if (state.meterPosition === 'bl') { x = 12; y = gh - h - 40; }
    else if (state.meterPosition === 'br') { x = gw - w - 20; y = gh - h - 40; }
    guiBuffer.push();
    guiBuffer.noStroke();
    // Fondo
    guiBuffer.fill(0, 150);
    guiBuffer.rect(x-2, y-2, w+4, h+24, 6);
    // Barra
    guiBuffer.fill(50, 50, 50, 200);
    guiBuffer.rect(x, y, w, h, 4);
    guiBuffer.fill(80, 200, 120, 240);
    guiBuffer.rect(x, y, (w * Math.min(state.lastCoverage,1)), h, 4);
    // Texto
    guiBuffer.fill(255);
    guiBuffer.textSize(12);
    guiBuffer.textAlign(LEFT, TOP);
    let modeLabel = (state.autoswitch && ((state.lastL1Coverage>0.01)||(state.lastL2Coverage>0.01))) ? 'mezcla A/B' : 'máscara';
    if (hasL1 && hasL2 && hasMask) {
      guiBuffer.text(`MaskMix (${modeLabel}) · máscara ${percent}% · umbral ${Math.round(state.threshold*100)}%`, x, y + h + 4);
    } else {
      guiBuffer.text(`MaskMix: faltan capas (1,2,3)`, x, y + h + 4);
    }
    guiBuffer.pop();
  }

  // API pública
  window.MaskMixMode = {
    init: initMaskMixMode,
    render: renderMaskMix,
    drawMeter: drawThresholdMeter,
    getCoverage: () => state.lastCoverage,
    isEnabled: () => state.enabled,
    setLayerIndices: (a,b,m) => {
      state.layer1Index = a; state.layer2Index = b; state.maskIndex = m;
    }
  };

  // No auto-init aquí: la inicialización la maneja sketch.js dentro de setup()
  // para asegurar que p5 y las capas estén listas antes de iniciar el modo.
})();