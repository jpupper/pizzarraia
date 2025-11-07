// Fragment shader para mezclar dos texturas usando una máscara y un umbral
precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D tex1;     // Capa 1 (base)
uniform sampler2D tex2;     // Capa 2 (revela donde hay máscara)
uniform sampler2D maskTex;  // Máscara (usa canal alpha)
uniform float threshold;    // 0..1
// Modo de visualización: si es 1.0 se muestra SOLO la máscara umbralizada
uniform float visualizeMaskOnly; // 0.0 = mezcla, 1.0 = visualizar máscara

void main() {
  vec4 c1 = texture2D(tex1, vTexCoord);
  vec4 c2 = texture2D(tex2, vTexCoord);
  vec4 m  = texture2D(maskTex, vTexCoord);
  float a = m.a; // Alpha como valor de máscara
  
  // Si visualizeMaskOnly está activo, mostrar una visualización binaria de la máscara
  if (visualizeMaskOnly > 0.5) {
    float on = step(threshold, a);
    gl_FragColor = vec4(vec3(on), 1.0);
  } else {
    // Conmutar capa2 cuando la máscara supera el umbral
    float switchVal = step(threshold, a);
    vec4 outColor = mix(c1, c2, switchVal);
    gl_FragColor = outColor;
  }
}