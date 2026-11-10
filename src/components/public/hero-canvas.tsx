"use client";

import { useEffect, useRef } from "react";

/**
 * A deliberately lightweight Three.js atmosphere for the hero. It is disabled
 * on small screens and for visitors who prefer reduced motion, and it pauses
 * when the tab is hidden. Geometry is a single point cloud with no post-processing.
 */
export function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mobile.matches || reduced.matches) return;

    let disposed = false;
    let cleanup = () => {};
    let frame = 0;

    void import("three").then((THREE) => {
      if (disposed || !container) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
      camera.position.z = 8;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      container.appendChild(renderer.domElement);

      const count = 150;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 7;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: 0x6366f1,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      points.rotation.x = 0.15;
      scene.add(points);

      const resize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();

      const observer = new ResizeObserver(resize);
      observer.observe(container);

      const pointer = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      const onPointer = (event: PointerEvent) => {
        target.x = (event.clientX / window.innerWidth - 0.5) * 0.35;
        target.y = (event.clientY / window.innerHeight - 0.5) * 0.25;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const animate = () => {
        if (document.hidden) {
          frame = requestAnimationFrame(animate);
          return;
        }
        pointer.x += (target.x - pointer.x) * 0.025;
        pointer.y += (target.y - pointer.y) * 0.025;
        points.rotation.y += 0.0006;
        points.rotation.x = 0.15 + pointer.y * 0.2;
        camera.position.x = pointer.x;
        camera.position.y = -pointer.y;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        window.removeEventListener("pointermove", onPointer);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
    />
  );
}
