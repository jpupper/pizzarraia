// ============================================================
// JPCONNECT — sesión del ecosistema para PizarraCollab
// ============================================================
// Esta app NO tiene formulario de login propio (regla §0.6 del manual FSC):
// el ingreso SIEMPRE es el de JPCONNECT, que vuelve a esta misma página con
//   ?token=<JWT>&username=<usuario>&userId=<id>
// El token se guarda en localStorage y se manda como `Authorization: Bearer`.
//
// Orden de carga obligatorio: config.js -> auth.js -> resto de la UI.
//
// OJO: JPCONNECT vive en el MISMO origen (fullscreencode.com), así que además
// de por la URL el token puede llegar guardado con las claves del ecosistema
// ('token' / 'username' / 'userId'). Las dos vías se adoptan.

(function () {
  'use strict';

  var LLAVE_TOKEN = 'pizarracollab_token';
  var LLAVE_USER = 'pizarracollab_user';

  // ── Utilidades de token ───────────────────────────────────────────────────
  // Un token sano es un JWT (3 partes separadas por punto). Si el retorno del
  // SSO llegó incompleto, localStorage puede quedar con el TEXTO "undefined":
  // eso se usaba como sesión válida y la app mandaba `Bearer undefined` a todo
  // el ecosistema (401 sin motivo visible).
  function tokenPlausible(t) {
    if (typeof t !== 'string' || !t) t = config.getToken();
    return typeof t === 'string' && t.length > 40 && t.split('.').length === 3;
  }

  function parseJwt(token) {
    try {
      var b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      var json = decodeURIComponent(atob(b64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  function tokenVencido(t) {
    var payload = parseJwt(t || config.getToken());
    if (!payload || typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 <= Date.now();
  }

  function estaLogueado() {
    return tokenPlausible();
  }

  // ── A dónde se vuelve │ ir al login de JPCONNECT ──────────────────────────
  // `destino` es una ruta de ESTA app (ej. 'profile.html'); sin destino se
  // vuelve a la página actual, sin los parámetros del SSO.
  function urlDeRetorno(destino) {
    // Sin destino se vuelve a la MISMA página (con su ?sesion=… si la tenía).
    var url = destino
      ? new URL(destino, window.location.origin + config.BASE_URL + '/')
      : new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('username');
    url.searchParams.delete('userId');
    url.searchParams.delete('ssoset');
    url.searchParams.delete('nosession');
    return url.toString();
  }

  function urlLogin(destino, aviso) {
    var q = '?redirect=' + encodeURIComponent(urlDeRetorno(destino)) +
      '&origin=' + encodeURIComponent(config.FSC_ORIGIN);
    if (aviso) q += '&aviso=' + encodeURIComponent(aviso);
    return config.FSCAUTH_URL + '/login.html' + q;
  }

  var __yendoAlLogin = false;
  function irALogin(destino, aviso) {
    if (__yendoAlLogin) return;
    var intentos = 0;
    try {
      intentos = Number(sessionStorage.getItem('piz_login_intentos') || '0') + 1;
      sessionStorage.setItem('piz_login_intentos', String(intentos));
    } catch (e) { /* modo privado */ }
    __yendoAlLogin = true;
    // Corte anti-loop: si ya rebotamos una vez, no se insiste (evita el
    // ping-pong login <-> app cuando el navegador no devuelve el token).
    if (intentos > 1) {
      __yendoAlLogin = false;
      window.location.href = config.BASE_URL + '/';
      return;
    }
    window.location.href = urlLogin(destino, aviso);
  }

  function urlRegistro(destino) {
    return config.FSCAUTH_URL + '/register.html?redirect=' +
      encodeURIComponent(urlDeRetorno(destino)) + '&origin=' + encodeURIComponent(config.FSC_ORIGIN);
  }

  // ── Cerrar sesión ─────────────────────────────────────────────────────────
  // El logout TAMBIÉN pasa por JPCONNECT (revoca el token del lado central),
  // y recién después se limpia la copia local.
  function cerrarSesion(volverA) {
    var destino = volverA || (config.BASE_URL + '/');
    try { config.removeToken(); config.removeUser(); } catch (e) {}
    try { localStorage.removeItem('token'); localStorage.removeItem('username'); localStorage.removeItem('userId'); } catch (e) {}
    var url = config.FSCAUTH_API + '/auth/logout?redirect=' + encodeURIComponent(
      new URL(destino, window.location.origin).toString()
    );
    window.location.href = url;
  }

  // ── Renovación deslizante de la sesión ────────────────────────────────────
  // Se manda el token local como Bearer y JPCONNECT devuelve uno con la ventana
  // completa otra vez. NO se usa la cookie fsc_token: es de terceros en los
  // dominios de las apps y el navegador la bloquea.
  function sincronizarSesion() {
    var token = config.getToken();
    if (!tokenPlausible(token)) return;
    fetch(config.FSCAUTH_API + '/auth/verify', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (res) {
      if (!res.ok) return null;                  // 401/proxy: no se toca la sesión
      return res.json().catch(function () { return null; });
    }).then(function (data) {
      if (data && data.token && data.token !== token) config.saveToken(data.token);
    }).catch(function () { /* sin red: no se cierra la sesión */ });
  }

  // ── Captura del retorno del login (ANTES que cualquier otro script) ───────
  (function adoptarSesion() {
    var params = new URLSearchParams(window.location.search);
    var urlToken = params.get('token');
    var urlUser = params.get('username');
    var urlId = params.get('userId');

    // Adopción: si el token no vino por la URL pero está guardado con las
    // claves del ecosistema (lo dejó el login de JPCONNECT, mismo origen), se
    // toma como sesión propia.
    if (!urlToken && !estaLogueado()) {
      try {
        var tEco = localStorage.getItem('token');
        var uEco = localStorage.getItem('username');
        if (tokenPlausible(tEco) && uEco) {
          config.saveToken(tEco);
          config.saveUser({ username: uEco, id: localStorage.getItem('userId') || null });
        }
      } catch (e) { /* sin localStorage */ }
    }

    if (urlToken && urlUser) {
      config.saveToken(urlToken);
      config.saveUser({ username: urlUser, id: urlId || null });
      try {
        sessionStorage.removeItem('piz_login_intentos');
      } catch (e) {}
      // Limpiar la URL: dejar el token a la vista es un riesgo.
      params.delete('token');
      params.delete('username');
      params.delete('userId');
      params.delete('ssoset');
      var q = params.toString();
      window.history.replaceState({}, document.title, window.location.pathname + (q ? '?' + q : ''));
      sincronizarSesion();
    }
  })();

  // ── Las páginas de acceso propias ya no existen ───────────────────────────
  // login.html / register.html quedaron como puentes (por links viejos y
  // marcadores) y sólo redirigen al login unificado.
  (function puenteDeAcceso() {
    var pag = window.location.pathname;
    var esLogin = /\/login\.html$/.test(pag);
    var esRegistro = /\/register\.html$/.test(pag);
    if (!esLogin && !esRegistro) return;
    var params = new URLSearchParams(window.location.search);
    if (params.has('token')) return;      // está volviendo del login: lo maneja adoptarSesion()
    if (estaLogueado()) {
      window.location.replace(config.BASE_URL + '/profile.html');
      return;
    }
    var destino = params.get('redirect') || (config.BASE_URL + '/profile.html');
    window.location.replace(esRegistro ? urlRegistro(destino) : urlLogin(destino));
  })();

  // ── API pública para el resto de la app ───────────────────────────────────
  window.pizarraAuth = {
    estaLogueado: estaLogueado,
    tokenPlausible: tokenPlausible,
    tokenVencido: tokenVencido,
    irALogin: irALogin,
    urlLogin: urlLogin,
    urlRegistro: urlRegistro,
    cerrarSesion: cerrarSesion,
    sincronizarSesion: sincronizarSesion
  };
  // Alias planos: las páginas viejas redirigían con `location.href = 'login.html'`.
  window.irALogin = irALogin;
  window.cerrarSesionFSC = cerrarSesion;
  window.estaLogueado = estaLogueado;
})();
