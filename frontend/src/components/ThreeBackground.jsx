import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        const W = mount.clientWidth;
        const H = mount.clientHeight;

        // ── Renderer ──────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W, H);
        renderer.setClearColor(0x02040a, 1);
        mount.appendChild(renderer.domElement);

        // ── Scene / Camera ────────────────────────────────────────
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 200);
        camera.position.set(0, 0, 0);

        // ── Fog ───────────────────────────────────────────────────
        scene.fog = new THREE.FogExp2(0x02040a, 0.018);

        // ── Wormhole Tube ─────────────────────────────────────────
        const tubePoints = [];
        const SEGMENTS = 300;
        for (let i = 0; i < SEGMENTS; i++) {
            const t = i / SEGMENTS;
            const angle = t * Math.PI * 8;
            const radius = 0.5 + Math.sin(t * Math.PI * 4) * 0.3;
            tubePoints.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius,
                    Math.sin(angle * 0.7) * radius * 0.5,
                    -i * 0.8
                )
            );
        }
        const path = new THREE.CatmullRomCurve3(tubePoints, false, "catmullrom", 0.5);

        const tubeGeo = new THREE.TubeGeometry(path, 800, 2.2, 12, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0x0a1628,
            side: THREE.BackSide,
            wireframe: false,
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        scene.add(tube);

        // ── Wireframe Overlay ─────────────────────────────────────
        const wireGeo = new THREE.TubeGeometry(path, 300, 2.21, 12, false);
        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x0d3d6e,
            wireframe: true,
            transparent: true,
            opacity: 0.25,
        });
        const wireMesh = new THREE.Mesh(wireGeo, wireMat);
        scene.add(wireMesh);

        // ── Flowing Particle Stream ───────────────────────────────
        const PARTICLE_COUNT = 3000;
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const speeds = new Float32Array(PARTICLE_COUNT);

        const palette = [
            new THREE.Color(0x00d4ff),
            new THREE.Color(0x0099ff),
            new THREE.Color(0x7b2fff),
            new THREE.Color(0x00ffcc),
            new THREE.Color(0xffffff),
        ];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const t = Math.random();
            const pt = path.getPoint(t);
            const spread = 1.8;
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * spread;

            positions[i * 3] = pt.x + Math.cos(angle) * r;
            positions[i * 3 + 1] = pt.y + Math.sin(angle) * r;
            positions[i * 3 + 2] = pt.z;

            const col = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            speeds[i] = 0.001 + Math.random() * 0.003;
        }

        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.045,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
        });

        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // Track per-particle path progress
        const tValues = new Float32Array(PARTICLE_COUNT);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            tValues[i] = Math.random();
        }

        // ── Ambient Glow Rings ────────────────────────────────────
        const ringCount = 20;
        const rings = [];
        for (let i = 0; i < ringCount; i++) {
            const t = i / ringCount;
            const pt = path.getPoint(t);
            const tangent = path.getTangent(t);

            const ringGeo = new THREE.TorusGeometry(2.15, 0.012, 8, 64);
            const ringColor = i % 2 === 0 ? 0x00d4ff : 0x7b2fff;
            const ringMat = new THREE.MeshBasicMaterial({
                color: ringColor,
                transparent: true,
                opacity: 0.18 + Math.random() * 0.12,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(pt);

            const axis = new THREE.Vector3(0, 0, 1);
            ring.quaternion.setFromUnitVectors(axis, tangent.normalize());

            scene.add(ring);
            rings.push(ring);
        }

        // ── Camera Path Progress ──────────────────────────────────
        let camT = 0;
        const CAM_SPEED = 0.00018;

        // ── Mouse Parallax ────────────────────────────────────────
        const mouse = { x: 0, y: 0 };
        const onMouseMove = (e) => {
            mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("mousemove", onMouseMove);

        // ── Resize ────────────────────────────────────────────────
        const onResize = () => {
            const w = mount.clientWidth;
            const h = mount.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        // ── Animation Loop ────────────────────────────────────────
        let frameId;
        const clock = new THREE.Clock();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            // Advance camera along tunnel
            camT = (camT + CAM_SPEED) % 0.98;
            const camPos = path.getPoint(camT);
            const lookAhead = path.getPoint(Math.min(camT + 0.02, 0.99));

            camera.position.copy(camPos);

            // Subtle mouse parallax offset
            camera.position.x += mouse.x * 0.3;
            camera.position.y += mouse.y * 0.3;

            camera.lookAt(lookAhead);

            // Update particle positions — stream along tunnel
            const pos = particleGeo.attributes.position;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                tValues[i] += speeds[i];
                if (tValues[i] > 0.99) tValues[i] = 0;

                const pt = path.getPoint(tValues[i]);
                const angle = elapsed * 0.3 + i * 0.1;
                const r = (Math.random() < 0.01 ? Math.random() : 0) * 1.8;

                pos.setXYZ(
                    i,
                    pt.x + Math.cos(angle) * (r || Math.abs(pos.getX(i) - pt.x)),
                    pt.y + Math.sin(angle) * (r || Math.abs(pos.getY(i) - pt.y)),
                    pt.z
                );
            }
            pos.needsUpdate = true;

            // Pulse rings
            rings.forEach((ring, idx) => {
                ring.material.opacity =
                    0.1 + Math.abs(Math.sin(elapsed * 0.6 + idx * 0.5)) * 0.25;
            });

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("resize", onResize);
            renderer.dispose();
            if (mount.contains(renderer.domElement)) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100vh" }}
        />
    );
}