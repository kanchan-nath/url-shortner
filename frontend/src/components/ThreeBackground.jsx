import { useEffect, useRef } from "react";
import * as THREE from "three";

const CONFIG = {
    NODE_COUNT: 100,
    CONNECTION_DISTANCE: 160,
    NODE_SPEED: 0.35,
    MOUSE_INFLUENCE_RADIUS: 200,
    MOUSE_FORCE: 0.045,
    NODE_SIZE: 3.2,
    LINE_OPACITY: 0.55,
    NODE_COLOR: new THREE.Color(0x00e5ff),
    LINE_COLOR: new THREE.Color(0x00cfff),
    GLOW_COLOR: new THREE.Color(0xffffff),
    BG_COLOR: new THREE.Color(0x020a14),
    FOG_NEAR: 400,
    FOG_FAR: 1000,
    DEPTH_SPREAD: 180,
};

export default function ThreeJsBackground({ style = {}, className = "" }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        // ── Renderer ──────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, // key change
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.setClearColor(CONFIG.BG_COLOR, 1);
        mount.appendChild(renderer.domElement);

        // ── Scene & Camera ────────────────────────────────────────────────────
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, CONFIG.FOG_NEAR, CONFIG.FOG_FAR);

        const camera = new THREE.PerspectiveCamera(
            60,
            mount.clientWidth / mount.clientHeight,
            1,
            1200
        );
        camera.position.z = 320;

        // ── Nodes ─────────────────────────────────────────────────────────────
        const W = mount.clientWidth;
        const H = mount.clientHeight;
        const spreadX = W * 0.60;
        const spreadY = H * 0.60;

        const nodes = Array.from({ length: CONFIG.NODE_COUNT }, () => ({
            x: (Math.random() - 0.5) * spreadX,
            y: (Math.random() - 0.5) * spreadY,
            z: (Math.random() - 0.5) * CONFIG.DEPTH_SPREAD,
            vx: (Math.random() - 0.5) * CONFIG.NODE_SPEED,
            vy: (Math.random() - 0.5) * CONFIG.NODE_SPEED,
            vz: (Math.random() - 0.5) * CONFIG.NODE_SPEED * 0.25,
            size: CONFIG.NODE_SIZE * (0.5 + Math.random() * 1.0),
        }));

        const nodeGeo = new THREE.BufferGeometry();
        const nodePositions = new Float32Array(CONFIG.NODE_COUNT * 3);
        const nodeSizes = new Float32Array(CONFIG.NODE_COUNT);
        const nodeBrightness = new Float32Array(CONFIG.NODE_COUNT);

        for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
            nodePositions[i * 3] = nodes[i].x;
            nodePositions[i * 3 + 1] = nodes[i].y;
            nodePositions[i * 3 + 2] = nodes[i].z;
            nodeSizes[i] = nodes[i].size;
            nodeBrightness[i] = 0.6 + Math.random() * 0.4;
        }
        nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
        nodeGeo.setAttribute("size", new THREE.BufferAttribute(nodeSizes, 1));
        nodeGeo.setAttribute("brightness", new THREE.BufferAttribute(nodeBrightness, 1));

        const nodeMat = new THREE.ShaderMaterial({
            uniforms: {
                coreColor: { value: CONFIG.NODE_COLOR },
                glowColor: { value: CONFIG.GLOW_COLOR },
                time: { value: 0 },
            },
            vertexShader: `
        attribute float size;
        attribute float brightness;
        uniform float time;
        varying float vBright;
        void main() {
          vBright = brightness * (0.80 + 0.20 * sin(time * 1.4 + position.y * 0.04));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (320.0 / -mv.z);
          gl_Position  = projectionMatrix * mv;
        }
      `,
            fragmentShader: `
        uniform vec3 coreColor;
        uniform vec3 glowColor;
        varying float vBright;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d  = length(uv);
          if (d > 0.5) discard;
          float core = 1.0 - smoothstep(0.0,  0.12, d);
          float halo = 1.0 - smoothstep(0.10, 0.32, d);
          float glow = 1.0 - smoothstep(0.25, 0.50, d);
          vec3 col   = mix(coreColor, glowColor, core);
          float alpha = (core * 1.0 + halo * 0.55 + glow * 0.20) * vBright;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        scene.add(new THREE.Points(nodeGeo, nodeMat));

        // ── Lines ─────────────────────────────────────────────────────────────
        const MAX_LINES = CONFIG.NODE_COUNT * 8;
        const lineGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array(MAX_LINES * 2 * 3);
        const lineColors = new Float32Array(MAX_LINES * 2 * 3);
        lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
        lineGeo.setAttribute("color", new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

        const lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: CONFIG.LINE_OPACITY,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        scene.add(new THREE.LineSegments(lineGeo, lineMat));

        // ── Mouse (listen on window so form card doesn't block it) ────────────
        const mouseWorld = { x: 99999, y: 99999 };
        const onMouseMove = (e) => {
            const rect = mount.getBoundingClientRect();
            mouseWorld.x = ((e.clientX - rect.left) / mount.clientWidth - 0.5) * spreadX;
            mouseWorld.y = -((e.clientY - rect.top) / mount.clientHeight - 0.5) * spreadY;
        };
        window.addEventListener("mousemove", onMouseMove);

        // ── Resize ────────────────────────────────────────────────────────────
        const onResize = () => {
            camera.aspect = mount.clientWidth / mount.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mount.clientWidth, mount.clientHeight);
        };
        window.addEventListener("resize", onResize);

        // ── Animation loop ────────────────────────────────────────────────────
        let animId;
        const clock = new THREE.Clock();
        const DIST2 = CONFIG.CONNECTION_DISTANCE * CONFIG.CONNECTION_DISTANCE;
        const MR2 = CONFIG.MOUSE_INFLUENCE_RADIUS * CONFIG.MOUSE_INFLUENCE_RADIUS;
        const lr = CONFIG.LINE_COLOR.r;
        const lg = CONFIG.LINE_COLOR.g;
        const lb = CONFIG.LINE_COLOR.b;

        const animate = () => {
            animId = requestAnimationFrame(animate);
            nodeMat.uniforms.time.value = clock.getElapsedTime();

            const hW = mount.clientWidth * 0.54;
            const hH = mount.clientHeight * 0.54;

            for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
                const n = nodes[i];

                // Mouse repulsion
                const dx = n.x - mouseWorld.x;
                const dy = n.y - mouseWorld.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < MR2 && d2 > 0.01) {
                    const d = Math.sqrt(d2);
                    const force = ((CONFIG.MOUSE_INFLUENCE_RADIUS - d) / CONFIG.MOUSE_INFLUENCE_RADIUS) * CONFIG.MOUSE_FORCE;
                    n.vx += (dx / d) * force;
                    n.vy += (dy / d) * force;
                }

                // Random micro-drift to keep things alive
                n.vx += (Math.random() - 0.5) * 0.006;
                n.vy += (Math.random() - 0.5) * 0.006;

                // Damping
                n.vx *= 0.978; n.vy *= 0.978; n.vz *= 0.975;

                // Speed cap
                const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
                const MAX = CONFIG.NODE_SPEED * 2.8;
                if (spd > MAX) { n.vx = (n.vx / spd) * MAX; n.vy = (n.vy / spd) * MAX; }

                n.x += n.vx; n.y += n.vy; n.z += n.vz;

                // Elastic boundary
                if (n.x > hW) { n.x = hW; n.vx *= -0.6; }
                if (n.x < -hW) { n.x = -hW; n.vx *= -0.6; }
                if (n.y > hH) { n.y = hH; n.vy *= -0.6; }
                if (n.y < -hH) { n.y = -hH; n.vy *= -0.6; }
                if (Math.abs(n.z) > CONFIG.DEPTH_SPREAD * 0.55) n.vz *= -0.6;

                nodePositions[i * 3] = n.x;
                nodePositions[i * 3 + 1] = n.y;
                nodePositions[i * 3 + 2] = n.z;
            }
            nodeGeo.attributes.position.needsUpdate = true;

            // Build line segments
            let li = 0;
            for (let i = 0; i < CONFIG.NODE_COUNT && li < MAX_LINES; i++) {
                for (let j = i + 1; j < CONFIG.NODE_COUNT && li < MAX_LINES; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dz = nodes[i].z - nodes[j].z;
                    const d2 = dx * dx + dy * dy + dz * dz;
                    if (d2 < DIST2) {
                        const fade = (1 - d2 / DIST2) ** 2; // quadratic: closer = much brighter
                        const b = li * 6;
                        linePositions[b] = nodes[i].x; linePositions[b + 1] = nodes[i].y; linePositions[b + 2] = nodes[i].z;
                        linePositions[b + 3] = nodes[j].x; linePositions[b + 4] = nodes[j].y; linePositions[b + 5] = nodes[j].z;
                        lineColors[b] = lr * fade; lineColors[b + 1] = lg * fade; lineColors[b + 2] = lb * fade;
                        lineColors[b + 3] = lr * fade; lineColors[b + 4] = lg * fade; lineColors[b + 5] = lb * fade;
                        li++;
                    }
                }
            }

            lineGeo.setDrawRange(0, li * 2);
            lineGeo.attributes.position.needsUpdate = true;
            lineGeo.attributes.color.needsUpdate = true;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            nodeGeo.dispose(); nodeMat.dispose();
            lineGeo.dispose(); lineMat.dispose();
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            ref={mountRef}
            className={className}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
                overflow: "hidden",
                ...style,
            }}
        />
    );
}