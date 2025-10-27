precision mediump float;

uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_rms;
uniform vec3 u_bands;
uniform sampler2D u_fft;
uniform vec3 u_colorDeep;
uniform vec3 u_colorSurface;
uniform vec3 u_colorHighlight;

varying vec2 vUv;

#ifndef MOBILE
  #define LAYER_COUNT 6
#else
  #define LAYER_COUNT 4
#endif

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
         (c - a) * u.y * (1.0 - u.x) +
         (d - b) * u.x * u.y;
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < LAYER_COUNT; i++) {
    value += amplitude * noise(p.xy * frequency);
    p.xy += vec2(0.35, -0.21) * u_bands.y;
    frequency *= 1.8 + u_bands.y * 0.2;
    amplitude *= 0.55;
  }

  return value;
}

float fftSample(float x) {
  return texture2D(u_fft, vec2(clamp(x, 0.0, 0.999), 0.5)).r;
}

vec3 nebula(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  centered.x *= u_resolution.x / max(u_resolution.y, 1.0);

  float brightness = mix(0.18, 1.25, clamp(u_rms * 1.9, 0.0, 1.0));
  float scale = mix(0.75, 1.45, clamp(u_bands.x * 1.2, 0.0, 1.0));
  float speed = mix(0.12, 0.55, clamp(u_bands.y, 0.0, 1.0));
  float jitter = mix(0.0, 0.35, clamp(u_bands.z, 0.0, 1.0));

  vec2 warp = vec2(
    sin(u_time * 1.6 + centered.y * 3.7),
    cos(u_time * 2.1 + centered.x * 4.1)
  ) * jitter * 0.05;

  centered += warp;

  vec3 pos = vec3(centered * scale, u_time * speed);

  float f = fbm(pos);

  float detail = fftSample(uv.x) * 0.35 + fftSample(uv.y) * 0.25;
  detail += fftSample(length(centered) * 0.4) * 0.4;

  f += detail * (0.2 + jitter * 0.4);

  float shimmer = 0.55 + 0.45 * sin(u_time * 1.1 + centered.x * 3.2 + centered.y * 2.6);
  vec3 oceanTint = mix(vec3(0.05, 0.32, 0.58), vec3(0.02, 0.6, 0.88), clamp(f + jitter * 0.35, 0.0, 1.0));
  oceanTint += vec3(0.08, 0.13, 0.22) * shimmer;
  oceanTint += vec3(0.1, 0.08, 0.16) * fftSample(0.3 + centered.y * 0.1);

  vec3 baseColor = mix(u_colorDeep, oceanTint, clamp(f, 0.0, 1.0));
  float highlight = smoothstep(0.48, 0.82, f + jitter * 0.25);
  vec3 shimmerColor = mix(baseColor, u_colorSurface, clamp(detail * 0.8, 0.0, 1.0));
  vec3 color = mix(shimmerColor, u_colorHighlight, highlight);
  color += 0.05 * vec3(fftSample(0.45), fftSample(0.58), fftSample(0.73));
  color *= brightness;

  float vignette = smoothstep(1.08, 0.32, length(centered));
  color *= vignette;

  return clamp(color, 0.0, 1.2);
}

void main() {
  float aberration = 0.004 + 0.006 * clamp(u_bands.z, 0.0, 1.0);
  vec2 dir = vec2(0.6, -0.8);

  vec3 col;
  col.r = nebula(vUv + dir * aberration * -0.5).r;
  col.g = nebula(vUv).g;
  col.b = nebula(vUv + dir * aberration * 0.5).b;

  gl_FragColor = vec4(col, 1.0);
}
