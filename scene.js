/* Optional decoration. The content, contacts and language do not depend on it. */
(function () {
    'use strict';
    const canvas = document.getElementById('canvas-webgl');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = () => {};
    let generation = 0;
    let libraries;
    function loadScript(resource) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = resource.url;
            script.integrity = resource.integrity;
            script.crossOrigin = 'anonymous';
            script.async = true;
            const timer = setTimeout(() => reject(new Error('Decoration timed out')), 12000);
            script.onload = () => { clearTimeout(timer); resolve(); };
            script.onerror = () => { clearTimeout(timer); reject(new Error('Decoration unavailable')); };
            document.head.appendChild(script);
        });
    }
    async function start() {
        const run = ++generation;
        cleanup();
        canvas.hidden = true;
        canvas.dataset.state = motion.matches ? 'reduced-motion' : 'loading';
        if (motion.matches) return;
        try {
            libraries ||= (async () => {
                await Promise.all(RESOURCES.slice(0, 2).map(loadScript));
                await loadScript(RESOURCES[2]);
            })();
            await libraries;
            if (run !== generation || motion.matches) return;
            if (!window.THREE || !window.gsap || !window.ScrollTrigger) throw new Error('Decoration unavailable');
            cleanup = createScene();
            canvas.hidden = false;
            canvas.dataset.state = 'animated';
        } catch (_) {
            canvas.dataset.state = 'static';
            canvas.hidden = true;
            // Expected offline/CDN/WebGL fallback; no UI initialization is here.
        }
    }
    function createScene() {
        const { THREE, gsap, ScrollTrigger } = window;
        const attributes = { alpha: true, antialias: true };
        const context = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
        if (!context) throw new Error('WebGL unavailable');
        const renderer = new THREE.WebGLRenderer({ canvas, context, ...attributes });
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, .1, 1000);
        camera.position.z = 100;
        const count = innerWidth < 768 ? 1200 : 3500;
        const original = Float32Array.from({ length: count * 3 }, () => (Math.random() - .5) * 300);
        const positions = original.slice();
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ size: .8, color: 0xff0033, transparent: true, opacity: .8 });
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        const outerGeometry = new THREE.IcosahedronGeometry(200, 1);
        const outerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0033, wireframe: true, transparent: true, opacity: .1 });
        const outer = new THREE.Mesh(outerGeometry, outerMaterial);
        scene.add(outer);
        const tweens = [], triggers = [];
        let morphTween, frame;
        gsap.registerPlugin(ScrollTrigger);
        function morph(shape) {
            morphTween?.kill();
            const from = positions.slice(), target = original.slice(), progress = { value: 0 };
            for (let i = 0; i < count; i++) {
                const n = i * 3;
                if (shape === 'torus') {
                    const u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2;
                    target[n] = (35 + 15 * Math.cos(v)) * Math.cos(u);
                    target[n + 1] = (35 + 15 * Math.cos(v)) * Math.sin(u);
                    target[n + 2] = 15 * Math.sin(v);
                } else if (shape === 'plane') {
                    const columns = Math.ceil(Math.sqrt(count));
                    target[n] = (i % columns - columns / 2) * 3;
                    target[n + 1] = (Math.floor(i / columns) - columns / 2) * 3;
                    target[n + 2] = Math.sin(target[n] * .1) * 15;
                }
            }
            // One tween and one buffer update per frame, instead of 3500 tweens.
            morphTween = gsap.to(progress, { value: 1, duration: 2.5, ease: 'power2.inOut', onUpdate() {
                for (let i = 0; i < positions.length; i++) positions[i] = from[i] + (target[i] - from[i]) * progress.value;
                geometry.attributes.position.needsUpdate = true;
            }});
        }
        tweens.push(gsap.to(particles.rotation, { y: Math.PI * .5, scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 } }));
        triggers.push(ScrollTrigger.create({ trigger: '.stats-container', start: 'top center', onEnter: () => morph('torus'), onLeaveBack: () => morph('chaos') }));
        triggers.push(ScrollTrigger.create({ trigger: '.service-row', start: 'top center', onEnter: () => morph('plane'), onLeaveBack: () => morph('torus') }));
        function resize() {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
            renderer.setSize(innerWidth, innerHeight);
        }
        function animate() {
            frame = requestAnimationFrame(animate);
            particles.rotation.z += .001;
            outer.rotation.x += .0005;
            outer.rotation.y -= .001;
            renderer.render(scene, camera);
        }
        function visibility() {
            cancelAnimationFrame(frame);
            if (!document.hidden) animate();
        }
        const dispose = () => {
            cancelAnimationFrame(frame);
            morphTween?.kill();
            triggers.forEach(trigger => trigger.kill());
            tweens.forEach(tween => { tween.scrollTrigger?.kill(); tween.kill(); });
            removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', visibility);
            canvas.removeEventListener('webglcontextlost', lost);
            geometry.dispose(); material.dispose(); outerGeometry.dispose(); outerMaterial.dispose(); renderer.dispose();
        };
        function lost(event) {
            event.preventDefault(); dispose(); canvas.hidden = true; canvas.dataset.state = 'static';
        }
        resize();
        addEventListener('resize', resize);
        document.addEventListener('visibilitychange', visibility);
        canvas.addEventListener('webglcontextlost', lost);
        if (!document.hidden) animate();
        return dispose;
    }
    // Local pinned copies + SRI; no external script executes in a visitor's browser.
    const RESOURCES = [{"url": "/vendor/three-0.128.0.min.js", "integrity": "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu"}, {"url": "/vendor/gsap-3.12.2.min.js", "integrity": "sha384-d+vyQ0dYcymoP8ndq2hW7FGC50nqGdXUEgoOUGxbbkAJwZqL7h+jKN0GGgn9hFDS"}, {"url": "/vendor/ScrollTrigger-3.12.2.min.js", "integrity": "sha384-poC0r6usQOX2Ayt/VGA+t81H6V3iN9L+Irz9iO8o+s0X20tLpzc9DOOtnKxhaQSE"}];
    motion.addEventListener('change', start);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
})();
