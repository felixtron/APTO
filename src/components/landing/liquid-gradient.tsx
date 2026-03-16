"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// TouchTexture — offscreen canvas that tracks cursor movement
// ---------------------------------------------------------------------------
class TouchTexture {
  size = 64;
  width = 64;
  height = 64;
  maxAge = 64;
  radius = 0.25 * 64;
  speed = 1 / 64;
  trail: {
    x: number;
    y: number;
    age: number;
    force: number;
    vx: number;
    vy: number;
  }[] = [];
  last: { x: number; y: number } | null = null;
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  texture!: THREE.CanvasTexture;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d")!;
    this.texture = new THREE.CanvasTexture(this.canvas);
  }

  addTouch(point: { x: number; y: number }) {
    let force = 0;
    let vx = 0;
    let vy = 0;

    if (this.last) {
      const dx = point.x - this.last.x;
      const dy = point.y - this.last.y;
      if (dx === 0 && dy === 0) return;
      const dd = dx * dx + dy * dy;
      const d = Math.sqrt(dd);
      vx = dx / d;
      vy = dy / d;
      force = Math.min(dd * 20000, 2.0);
    }

    this.last = { x: point.x, y: point.y };
    this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
  }

  update() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.98)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = this.trail.length - 1; i >= 0; i--) {
      const point = this.trail[i];
      point.age += this.speed;

      if (point.age > 1) {
        this.trail.splice(i, 1);
      } else {
        point.x += point.vx * point.force * 0.5;
        point.y += point.vy * point.force * 0.5;
        const alpha = (1 - point.age) * point.force;
        this.drawPoint(point.x, point.y, this.radius, alpha);
      }
    }

    this.texture.needsUpdate = true;
  }

  drawPoint(x: number, y: number, radius: number, alpha: number) {
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// GLSL shaders
// ---------------------------------------------------------------------------
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// APTO brand colors (RGB 0-1):
// Brand blue  #2E6DA4 → (0.180, 0.427, 0.643)
// Brand green #2D7A3A → (0.176, 0.478, 0.227)
// Dark blue   #0E2A42 → (0.055, 0.165, 0.259)
// Mid blue    #1B4F7A → (0.106, 0.310, 0.478)
// Accent blue #3A92C8 → (0.227, 0.573, 0.784)
// Accent green#5BA848 → (0.357, 0.659, 0.282)
const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform vec3 uColor5;
  uniform vec3 uColor6;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform sampler2D uTouchTexture;
  uniform float uGrainIntensity;

  varying vec2 vUv;

  vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                             dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 sx = sign(x);
    vec3 sh = sign(h);
    vec3 ph = sx * ox;
    vec3 a0 = x - ph;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    return 130.0 * dot(m, vec3(sin(ph.x + ph.y), sin(ph.y + ph.z),
                                sin(ph.z + ph.x)) * sh);
  }

  vec3 grain(vec2 uv) {
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    return vec3(noise) * uGrainIntensity;
  }

  void main() {
    vec2 uv = vUv;

    vec4 touchData = texture2D(uTouchTexture, uv);
    float touchInfluence = touchData.r;

    vec2 center1 = vec2(0.5 + 0.3 * sin(uTime * uSpeed * 0.3),
                        0.5 + 0.3 * cos(uTime * uSpeed * 0.4));
    vec2 center2 = vec2(0.2 + 0.2 * sin(uTime * uSpeed * 0.2),
                        0.7 + 0.2 * cos(uTime * uSpeed * 0.3));
    vec2 center3 = vec2(0.8 + 0.25 * sin(uTime * uSpeed * 0.25),
                        0.3 + 0.25 * cos(uTime * uSpeed * 0.35));

    float dist1 = distance(uv, center1);
    float dist2 = distance(uv, center2);
    float dist3 = distance(uv, center3);

    uv += vec2(touchData.g - 0.5, touchData.b - 0.5) * 0.1;
    uv += vec2(snoise(uv + uTime * 0.1) * 0.02);

    vec3 color = mix(uColor1, uColor2, smoothstep(0.3, 0.8, dist1));
    color = mix(color, uColor3, smoothstep(0.4, 0.7, dist2));
    color = mix(color, uColor4, smoothstep(0.35, 0.75, dist3));
    color = mix(color, uColor5, touchInfluence * 0.3);

    color += grain(vUv);

    // Dark base tone — deep navy
    color = mix(color, vec3(0.04, 0.06, 0.15), 0.15);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------
export function LiquidGradient() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ---- Renderer ----
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ---- Scene / Camera ----
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      10000,
    );
    camera.position.z = 50;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1628);

    // ---- Touch Texture ----
    const touchTexture = new TouchTexture();

    // ---- Uniforms (APTO brand palette) ----
    const uniforms = {
      uTime: { value: 0 },
      uResolution: {
        value: new THREE.Vector2(container.clientWidth, container.clientHeight),
      },
      uColor1: { value: new THREE.Vector3(0.180, 0.427, 0.643) }, // #2E6DA4
      uColor2: { value: new THREE.Vector3(0.055, 0.165, 0.259) }, // #0E2A42
      uColor3: { value: new THREE.Vector3(0.176, 0.478, 0.227) }, // #2D7A3A
      uColor4: { value: new THREE.Vector3(0.227, 0.573, 0.784) }, // #3A92C8
      uColor5: { value: new THREE.Vector3(0.357, 0.659, 0.282) }, // #5BA848
      uColor6: { value: new THREE.Vector3(0.106, 0.310, 0.478) }, // #1B4F7A
      uSpeed: { value: 1.2 },
      uIntensity: { value: 1.8 },
      uTouchTexture: { value: touchTexture.texture },
      uGrainIntensity: { value: 0.08 },
    };

    // ---- Plane mesh ----
    const geometry = new THREE.PlaneGeometry(camera.aspect * 100, 100);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
      transparent: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ---- Clock ----
    const clock = new THREE.Clock();

    // ---- Mouse / Touch handlers ----
    function onMouseMove(ev: MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      const x =
        ((ev.clientX - rect.left) / rect.width) * touchTexture.width;
      const y =
        ((rect.height - (ev.clientY - rect.top)) / rect.height) *
        touchTexture.height;
      touchTexture.addTouch({ x, y });
    }

    function onTouchMove(ev: TouchEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      for (const touch of Array.from(ev.touches)) {
        const x =
          ((touch.clientX - rect.left) / rect.width) * touchTexture.width;
        const y =
          ((rect.height - (touch.clientY - rect.top)) / rect.height) *
          touchTexture.height;
        touchTexture.addTouch({ x, y });
      }
    }

    // ---- Resize handler ----
    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);

      // Update plane geometry to cover camera frustum
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(camera.aspect * 100, 100);
    }

    // ---- Animation loop ----
    let animationId: number;
    function tick() {
      animationId = requestAnimationFrame(tick);
      const delta = Math.min(clock.getDelta(), 0.1);
      touchTexture.update();
      uniforms.uTime.value += delta;
      renderer.render(scene, camera);
    }

    // ---- Attach listeners ----
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("resize", onResize);

    tick();

    // ---- Cleanup ----
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  );
}
