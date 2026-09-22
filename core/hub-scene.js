// Extraido de index.html lineas 1360-3839 por pipelines/extract_script.py
// Contenido byte-exacto: no editar a mano sin volver a verificar.
    import * as THREE from "three";
    import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
    import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
    import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
    import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
    import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
    import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

    window.__BELENTANI_STARTED__ = true;

    const canvas = document.getElementById("webgl");
    const fatal = document.getElementById("fatal");
    const fatalMessage = document.getElementById("fatalMessage");
    const isMobile = matchMedia("(max-width: 720px), (pointer: coarse)").matches;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    function fail(error) {
      console.error(error);
      fatalMessage.textContent = String(error?.stack || error?.message || error);
      fatal.classList.add("show");
      document.getElementById("boot")?.classList.add("done");
    }

    function supportsWebGL() {
      try {
        const test = document.createElement("canvas");
        return !!(window.WebGL2RenderingContext && test.getContext("webgl2")) ||
               !!test.getContext("webgl");
      } catch {
        return false;
      }
    }

    if (!supportsWebGL()) {
      fail(new Error("WebGL no está disponible en este navegador o equipo."));
      throw new Error("WebGL unavailable");
    }

    try {
      const clock = new THREE.Clock();
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x030105, 0.005);

      const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.05, 400);
      camera.position.set(0, 0.25, isMobile ? 12.8 : 10.8);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
      });
      renderer.setClearColor(0x010102, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      let qualityMode = "auto";
      let currentDpr = 1;

      function desiredPixelRatio() {
        if (qualityMode === "eco") return 1;
        if (qualityMode === "ultra") return Math.min(devicePixelRatio, 2);
        return Math.min(devicePixelRatio, isMobile ? 1.25 : 1.6);
      }

      currentDpr = desiredPixelRatio();
      renderer.setPixelRatio(currentDpr);
      renderer.setSize(innerWidth, innerHeight, false);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environmentTarget = pmrem.fromScene(room, 0.04);
      scene.environment = environmentTarget.texture;
      room.dispose();
      pmrem.dispose();

      const composer = new EffectComposer(renderer);
      if (composer.setPixelRatio) composer.setPixelRatio(currentDpr);

      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(innerWidth, innerHeight),
        isMobile ? 0.85 : 1.15,
        1.1,
        0.18
      );
      composer.addPass(bloomPass);

      const CinematicShader = {
        uniforms: {
          tDiffuse: { value: null },
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(innerWidth * currentDpr, innerHeight * currentDpr) },
          uAberration: { value: isMobile ? 0.0011 : 0.0022 },
          uGrain: { value: 0.032 },
          uVignette: { value: 0.72 },
          uGodRayCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uGodRayIntensity: { value: 0.0 },
          uHeatCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uHeatIntensity: { value: 0.0 },
          uColorGrade: { value: new THREE.Vector3(1.0, 0.95, 0.92) },
          uMotionBlur: { value: 0.0 },
          uMotionDir: { value: new THREE.Vector2(0, 0) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float uTime;
          uniform vec2 uResolution;
          uniform float uAberration;
          uniform float uGrain;
          uniform float uVignette;
          uniform vec2 uGodRayCenter;
          uniform float uGodRayIntensity;
          uniform vec2 uHeatCenter;
          uniform float uHeatIntensity;
          uniform vec3 uColorGrade;
          uniform float uMotionBlur;
          uniform vec2 uMotionDir;
          varying vec2 vUv;

          float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            vec2 uv = vUv;
            vec2 centered = uv - 0.5;
            float radial = dot(centered, centered);

            // --- HEAT DISTORTION (gravitational lensing near objects) ---
            vec2 toHeat = uv - uHeatCenter;
            float heatDist = length(toHeat);
            float heatWarp = uHeatIntensity * exp(-heatDist * 8.0) *
              sin(heatDist * 45.0 - uTime * 3.5) * 0.004;
            uv += normalize(toHeat + 0.001) * heatWarp;

            // --- CHROMATIC ABERRATION (enhanced with radial + axial) ---
            vec2 shift = centered * radial * uAberration * 12.0;
            vec2 axial = vec2(sin(uTime * 0.7) * 0.0003, cos(uTime * 0.5) * 0.0002);
            float r = texture2D(tDiffuse, uv + shift + axial).r;
            float g = texture2D(tDiffuse, uv).g;
            float b = texture2D(tDiffuse, uv - shift - axial).b;
            vec3 color = vec3(r, g, b);

            // --- GOD RAYS (radial light shaft from bright center) ---
            if (uGodRayIntensity > 0.001) {
              vec2 rayDir = uv - uGodRayCenter;
              vec3 rays = vec3(0.0);
              float decay = 1.0;
              vec2 sampleUv = uv;
              for (int i = 0; i < 24; i++) {
                sampleUv -= rayDir * 0.018;
                vec3 s = texture2D(tDiffuse, sampleUv).rgb;
                float lum = dot(s, vec3(0.2126, 0.7152, 0.0722));
                rays += s * max(0.0, lum - 0.45) * decay;
                decay *= 0.955;
              }
              color += rays * uGodRayIntensity * 0.035;
            }

            // --- ANAMORPHIC STREAK (horizontal lens flare) ---
            float streak = 0.0;
            for (int i = -6; i <= 6; i++) {
              vec2 su = vec2(uv.x + float(i) * 0.008, uv.y);
              float lum = dot(texture2D(tDiffuse, su).rgb, vec3(0.2126, 0.7152, 0.0722));
              streak += max(0.0, lum - 0.7) * exp(-abs(float(i)) * 0.4);
            }
            color += vec3(0.85, 0.35, 0.45) * streak * 0.06;

            // --- FILM GRAIN (temporal + spatial) ---
            float grain = hash21(uv * uResolution + fract(uTime) * 213.4) - 0.5;
            float grain2 = hash21(uv * uResolution * 1.7 + fract(uTime * 1.3) * 71.2) - 0.5;
            color += (grain * 0.7 + grain2 * 0.3) * uGrain;

            // --- VIGNETTE (dual-layer: optical + cinematic) ---
            float vigOpt = smoothstep(0.88, 0.16, radial * uVignette);
            float vigCine = 1.0 - pow(radial * 1.2, 1.8) * 0.35;
            color *= mix(0.58, 1.0, vigOpt) * vigCine;

            // --- SCANLINES ---
            float scan = sin((uv.y * uResolution.y) * 1.55) * 0.003;
            color -= scan;

            // --- MOTION BLUR (during journey) ---
            if (uMotionBlur > 0.001) {
              vec3 mblur = vec3(0.0);
              for (int mi = 1; mi <= 8; mi++) {
                mblur += texture2D(tDiffuse, uv - uMotionDir * float(mi) * 0.003 * uMotionBlur).rgb;
              }
              color = mix(color, mblur / 8.0, uMotionBlur * 0.5);
            }

            // --- SOFT BOKEH EDGES (cinematic DoF) ---
            float bokeh = smoothstep(0.15, 0.42, radial);
            if (bokeh > 0.01) {
              vec3 blur = vec3(0.0);
              float bw = bokeh * 0.0025;
              for (int bi = 0; bi < 6; bi++) {
                float a = float(bi) * 1.0472;
                blur += texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * bw).rgb;
              }
              blur /= 6.0;
              color = mix(color, blur, bokeh * 0.35);
            }

            // --- LENS DIRT (subtle bright spots at edges) ---
            float dirt1 = pow(max(0.0, sin(centered.x * 12.0 + centered.y * 8.0)), 16.0);
            float dirt2 = pow(max(0.0, sin(centered.x * 7.0 - centered.y * 11.0 + 1.0)), 20.0);
            float lum2 = dot(color, vec3(0.2126, 0.7152, 0.0722));
            color += vec3(0.9, 0.5, 0.35) * (dirt1 + dirt2) * max(0.0, lum2 - 0.5) * 0.08;

            // --- COLOR GRADING (dynamic per-zone) ---
            color *= uColorGrade;
            float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
            color = mix(vec3(lum), color, 1.12);
            color = pow(color, vec3(0.97));

            gl_FragColor = vec4(max(color, 0.0), 1.0);
          }
        `
      };

      const cinematicPass = new ShaderPass(CinematicShader);
      composer.addPass(cinematicPass);
      composer.addPass(new OutputPass());

      // ---------- UTILIDADES DE SHADER ----------
      // Simplex Noise 3D (Ashima/webgl-noise, public domain)
      const simplexNoiseGLSL = `
        vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
        vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
        vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284-0.85373*r;}
        float snoise(vec3 v){
          const vec2 C=vec2(1./6.,1./3.);
          const vec4 D=vec4(0.,.5,1.,2.);
          vec3 i=floor(v+dot(v,C.yyy));
          vec3 x0=v-i+dot(i,C.xxx);
          vec3 g=step(x0.yzx,x0.xyz);
          vec3 l=1.-g;
          vec3 i1=min(g,l.zxy);
          vec3 i2=max(g,l.zxy);
          vec3 x1=x0-i1+C.xxx;
          vec3 x2=x0-i2+C.yyy;
          vec3 x3=x0-D.yyy;
          i=mod289(i);
          vec4 p=permute(permute(permute(
            i.z+vec4(0.,i1.z,i2.z,1.))
            +i.y+vec4(0.,i1.y,i2.y,1.))
            +i.x+vec4(0.,i1.x,i2.x,1.));
          float n_=0.142857;
          vec3 ns=n_*D.wyz-D.xzx;
          vec4 j=p-49.*floor(p*ns.z*ns.z);
          vec4 x_=floor(j*ns.z);
          vec4 y_=floor(j-7.*x_);
          vec4 x=x_*ns.x+ns.yyyy;
          vec4 y=y_*ns.x+ns.yyyy;
          vec4 h=1.-abs(x)-abs(y);
          vec4 b0=vec4(x.xy,y.xy);
          vec4 b1=vec4(x.zw,y.zw);
          vec4 s0=floor(b0)*2.+1.;
          vec4 s1=floor(b1)*2.+1.;
          vec4 sh=-step(h,vec4(0.));
          vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
          vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
          vec3 p0=vec3(a0.xy,h.x);
          vec3 p1=vec3(a0.zw,h.y);
          vec3 p2=vec3(a1.xy,h.z);
          vec3 p3=vec3(a1.zw,h.w);
          vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
          p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
          vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
          m=m*m;
          return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }
        float sfbm(vec3 p){
          float f=0.,a=.5;
          for(int i=0;i<5;i++){f+=a*snoise(p);p*=2.01;a*=.49;}
          return f;
        }
      `;
      const valueNoiseGLSL = `
        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float vnoise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);

          return mix(
            mix(
              mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
              mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x),
              f.y
            ),
            mix(
              mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
              mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x),
              f.y
            ),
            f.z
          );
        }

        float fbm(vec3 p) {
          float sum = 0.0;
          float amp = 0.5;
          mat3 rot = mat3(
             0.00,  0.80,  0.60,
            -0.80,  0.36, -0.48,
            -0.60, -0.48,  0.64
          );
          for (int i = 0; i < 5; i++) {
            sum += amp * vnoise(p);
            p = rot * p * 2.03 + 13.7;
            amp *= 0.5;
          }
          return sum;
        }
      `;

      // ---------- FONDO: NEBULOSA PROCEDURAL ----------
      const nebulaUniforms = {
        uTime: { value: 0 },
        uRed: { value: new THREE.Color(0xff003c) },
        uCyan: { value: new THREE.Color(0x4af4ff) }
      };

      const nebula = new THREE.Mesh(
        new THREE.SphereGeometry(58, isMobile ? 32 : 48, isMobile ? 20 : 32),
        new THREE.ShaderMaterial({
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: nebulaUniforms,
          vertexShader: `
            varying vec3 vDirection;
            void main() {
              vDirection = normalize(position);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uRed;
            uniform vec3 uCyan;
            varying vec3 vDirection;
            ${simplexNoiseGLSL}

            void main() {
              vec3 d = normalize(vDirection);
              float n1 = sfbm(d * 4.1 + vec3(uTime * 0.018, -uTime * 0.011, 0.0));
              float n2 = sfbm(d * 9.0 - vec3(0.0, uTime * 0.013, uTime * 0.008));
              float n3 = snoise(d * 16.0 + vec3(uTime * 0.007));
              float bands = pow(max(0.0, n1 * 0.78 + n2 * 0.34 - 0.44), 2.1);

              float redMask = smoothstep(0.22, 0.88, d.y * 0.35 + n1);
              float cyanMask = smoothstep(0.63, 0.92, n2 + d.x * 0.16);
              float dustMask = pow(max(0.0, n3 * 0.5 + 0.5), 3.0);

              vec3 base = vec3(0.0015, 0.0007, 0.003);
              vec3 color = base;
              color += uRed * bands * (0.12 + redMask * 0.56);
              color += uCyan * pow(cyanMask, 5.0) * 0.055;
              color += vec3(0.11, 0.015, 0.08) * pow(n1, 5.0) * 0.16;
              color += vec3(0.04, 0.005, 0.02) * dustMask * 0.3;

              float horizon = pow(1.0 - abs(d.y), 7.0);
              color += uRed * horizon * 0.008;

              gl_FragColor = vec4(color, 1.0);
            }
          `
        })
      );
      scene.add(nebula);

      // ---------- CAMPO MAGNÉTICO VISUAL (linhas de força) ----------
      (function createMagneticField() {
        var lineCount = isMobile ? 8 : 16;
        var pointsPerLine = 64;
        var positions = [];
        var indices = [];
        for (var l = 0; l < lineCount; l++) {
          var phi = (l / lineCount) * Math.PI * 2;
          var tilt = (l % 3 === 0) ? 0.3 : (l % 3 === 1) ? -0.2 : 0.0;
          var base = positions.length / 3;
          for (var p = 0; p < pointsPerLine; p++) {
            var t = (p / (pointsPerLine - 1)) * Math.PI;
            var r = 3 + Math.sin(t) * 12;
            var y = Math.cos(t) * 8 + tilt * Math.sin(t * 2) * 3;
            var x = Math.cos(phi + t * 0.3) * r;
            var z = Math.sin(phi + t * 0.3) * r;
            positions.push(x, y, z);
            if (p < pointsPerLine - 1) indices.push(base + p, base + p + 1);
          }
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geo.setIndex(indices);
        var mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 } },
          vertexShader: `
            uniform float uTime;
            varying float vFlow; varying float vDist;
            void main() {
              vFlow = position.y * 0.08 + position.x * 0.03;
              vDist = length(position.xz) * 0.05;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying float vFlow; varying float vDist;
            void main() {
              float pulse = pow(fract(vFlow - uTime * 0.2), 16.0) * 0.5;
              float fade = exp(-vDist * 1.5);
              vec3 col = vec3(0.6, 0.05, 0.12) * pulse * fade;
              gl_FragColor = vec4(col, pulse * fade * 0.08);
            }
          `
        });
        var field = new THREE.LineSegments(geo, mat);
        field.userData.magFieldMat = mat;
        scene.add(field);
      })();

      // ---------- ACCRETION DISK (fundo distante) ----------
      const accretionGeom = new THREE.PlaneGeometry(12, 12);
      const accretionMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv);
            float angle = atan(uv.y, uv.x);
            float disk = smoothstep(0.08, 0.25, r) * (1.0 - smoothstep(0.25, 0.48, r));
            float turb = sin(r * 28.0 - uTime * 1.5 + angle * 5.0) * 0.5 + 0.5;
            float ring = exp(-pow((r - 0.12) * 18.0, 2.0));
            vec3 col = vec3(0.9, 0.04, 0.12) * disk * turb * 0.6;
            col += vec3(1.0, 0.25, 0.15) * ring * 0.35;
            col += vec3(0.4, 0.0, 0.08) * smoothstep(0.48, 0.06, r) * 0.15;
            float alpha = (disk * turb * 0.4 + ring * 0.3) * smoothstep(0.5, 0.2, r);
            gl_FragColor = vec4(col, alpha * 0.55);
          }
        `
      });
      const accretionDisk = new THREE.Mesh(accretionGeom, accretionMat);
      accretionDisk.position.set(8, 4, -55);
      accretionDisk.rotation.set(-0.3, 0.5, 0.2);
      scene.add(accretionDisk);

      const accretionDisk2 = new THREE.Mesh(accretionGeom.clone(), accretionMat.clone());
      accretionDisk2.position.set(-15, -6, -65);
      accretionDisk2.rotation.set(0.4, -0.3, -0.15);
      accretionDisk2.scale.setScalar(0.7);
      accretionDisk2.material.uniforms.uTime = { value: 0 };
      scene.add(accretionDisk2);

      // ---------- ESTRELLAS GPU ----------
      function createStarfield(count) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);

        const white = new THREE.Color(0xeef7ff);
        const red = new THREE.Color(0xff174f);
        const cyan = new THREE.Color(0x8bfaff);
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
          const radius = 17 + Math.pow(Math.random(), 0.42) * 48;
          const theta = Math.random() * Math.PI * 2;
          const z = Math.random() * 2 - 1;
          const xy = Math.sqrt(1 - z * z);

          positions[i * 3] = radius * xy * Math.cos(theta);
          positions[i * 3 + 1] = radius * z;
          positions[i * 3 + 2] = radius * xy * Math.sin(theta);

          const pick = Math.random();
          color.copy(pick > 0.965 ? red : pick > 0.91 ? cyan : white);
          color.multiplyScalar(0.48 + Math.random() * 0.72);

          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
          sizes[i] = 0.8 + Math.pow(Math.random(), 4) * 4.6;
          phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: currentDpr }
          },
          vertexShader: `
            attribute vec3 aColor;
            attribute float aSize;
            attribute float aPhase;
            uniform float uTime;
            uniform float uPixelRatio;
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              float twinkle = 0.58 + 0.42 * sin(uTime * (0.7 + fract(aPhase) * 1.9) + aPhase);
              vColor = aColor;
              vAlpha = twinkle;
              gl_PointSize = min(10.0, aSize * uPixelRatio * twinkle * (230.0 / max(1.0, -mv.z)));
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
              vec2 p = gl_PointCoord - 0.5;
              float d = length(p);
              float core = smoothstep(0.5, 0.02, d);
              float halo = exp(-d * 8.5);
              float alpha = (core * 0.75 + halo * 0.45) * vAlpha;
              if (alpha < 0.02) discard;
              gl_FragColor = vec4(vColor * (1.0 + halo), alpha);
            }
          `
        });

        const stars = new THREE.Points(geometry, material);
        stars.userData.material = material;
        return stars;
      }

      const stars = createStarfield(isMobile ? 4200 : 9500);
      scene.add(stars);

      // Deep-field galaxy dust — visible from far away as red glow
      (function createDeepField() {
        var N = isMobile ? 3000 : 7000;
        var geo = new THREE.BufferGeometry();
        var pos = new Float32Array(N * 3);
        var col = new Float32Array(N * 3);
        var siz = new Float32Array(N);
        for (var i = 0; i < N; i++) {
          var r = 60 + Math.pow(Math.random(), 0.3) * 180;
          var th = Math.random() * Math.PI * 2;
          var ph = (Math.random() - 0.5) * 1.2;
          pos[i*3] = r * Math.cos(th) * Math.cos(ph);
          pos[i*3+1] = r * Math.sin(ph) * 0.35;
          pos[i*3+2] = r * Math.sin(th) * Math.cos(ph);
          var p = Math.random();
          col[i*3] = p > 0.7 ? 0.9 + Math.random()*0.1 : 0.4 + Math.random()*0.3;
          col[i*3+1] = p > 0.95 ? 0.5 : p > 0.7 ? 0.05 : 0.3 + Math.random()*0.2;
          col[i*3+2] = p > 0.7 ? 0.15 + Math.random()*0.15 : 0.5 + Math.random()*0.3;
          siz[i] = 0.5 + Math.random() * 2.0;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        geo.setAttribute("size", new THREE.BufferAttribute(siz, 1));
        var mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 } },
          vertexShader: "attribute float size; attribute vec3 color; varying vec3 vC; uniform float uTime; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); float tw=0.6+0.4*sin(uTime*0.3+position.x*0.02); vC=color; gl_PointSize=size*tw*(180.0/max(1.0,-mv.z)); gl_Position=projectionMatrix*mv; }",
          fragmentShader: "varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=exp(-d*6.0)*0.55; if(a<0.01)discard; gl_FragColor=vec4(vC,a); }"
        });
        var pts = new THREE.Points(geo, mat);
        pts.userData.deepFieldMat = mat;
        scene.add(pts);
      })();

      // ---------- LUCES ----------
      scene.add(new THREE.AmbientLight(0x273142, 0.22));

      const redLight = new THREE.PointLight(0xff003c, 16, 18, 1.8);
      redLight.position.set(0.2, 0.5, 2.8);
      scene.add(redLight);

      const goldLight = new THREE.PointLight(0xffc447, 11, 11, 2);
      goldLight.position.set(4.4, 1.6, 3.2);
      scene.add(goldLight);

      const cyanLight = new THREE.PointLight(0x75f8ff, 10, 11, 2);
      cyanLight.position.set(-4.2, 1.5, 3.4);
      scene.add(cyanLight);

      const rimLight = new THREE.DirectionalLight(0xffffff, 2.3);
      rimLight.position.set(-1, 5, 6);
      scene.add(rimLight);

      // ---------- POLVO CÓSMICO FLOTANTE ----------
      (function createCosmicDust() {
        var N = isMobile ? 120 : 280;
        var geo = new THREE.BufferGeometry();
        var pos = new Float32Array(N * 3);
        var vel = new Float32Array(N * 3);
        var siz = new Float32Array(N);
        for (var i = 0; i < N; i++) {
          pos[i*3]   = (Math.random() - 0.5) * 20;
          pos[i*3+1] = (Math.random() - 0.5) * 12;
          pos[i*3+2] = (Math.random() - 0.5) * 20;
          vel[i*3]   = (Math.random() - 0.5) * 0.003;
          vel[i*3+1] = (Math.random() - 0.5) * 0.002;
          vel[i*3+2] = (Math.random() - 0.5) * 0.003;
          siz[i] = 0.3 + Math.random() * 1.5;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
        geo.setAttribute("aSize", new THREE.BufferAttribute(siz, 1));
        var mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 }, uCamPos: { value: new THREE.Vector3() } },
          vertexShader: `
            attribute vec3 aVel; attribute float aSize;
            uniform float uTime; uniform vec3 uCamPos;
            varying float vAlpha;
            void main() {
              vec3 p = position + aVel * uTime * 60.0;
              p = mod(p - uCamPos + 10.0, 20.0) - 10.0 + uCamPos;
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              float dist = -mv.z;
              vAlpha = smoothstep(12.0, 2.0, dist) * smoothstep(0.3, 1.5, dist);
              gl_PointSize = aSize * (120.0 / max(1.0, dist));
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - 0.5);
              float a = exp(-d * 7.0) * vAlpha * 0.25;
              if (a < 0.005) discard;
              gl_FragColor = vec4(0.75, 0.55, 0.65, a);
            }
          `
        });
        var dust = new THREE.Points(geo, mat);
        dust.frustumCulled = false;
        dust.userData.dustMat = mat;
        scene.add(dust);
      })();

      // ---------- PLANETA VIVO ----------
      const planetUniforms = {
        uTime: { value: 0 },
        uRed: { value: new THREE.Color(0xff003c) },
        uRedHot: { value: new THREE.Color(0xff6b8f) },
        uCyan: { value: new THREE.Color(0x64f8ff) }
      };

      const planetMaterial = new THREE.ShaderMaterial({
        uniforms: planetUniforms,
        vertexShader: `
          uniform float uTime;
          varying vec3 vWorldPosition;
          varying vec3 vWorldNormal;
          varying vec3 vObjectPosition;
          varying float vTerrain;
          ${valueNoiseGLSL}

          void main() {
            vec3 n = normalize(normal);
            float macro = fbm(n * 3.4 + vec3(uTime * 0.026, -uTime * 0.018, 0.0));
            float detail = vnoise(n * 18.0 - vec3(0.0, uTime * 0.035, 0.0));
            float breath = sin(uTime * 1.35 + macro * 8.0) * 0.018;
            float displacement = (macro - 0.5) * 0.16 + (detail - 0.5) * 0.028 + breath;
            vec3 displaced = position + n * displacement;

            vec4 world = modelMatrix * vec4(displaced, 1.0);
            vWorldPosition = world.xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vObjectPosition = n;
            vTerrain = macro + detail * 0.15;
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uRed;
          uniform vec3 uRedHot;
          uniform vec3 uCyan;
          varying vec3 vWorldPosition;
          varying vec3 vWorldNormal;
          varying vec3 vObjectPosition;
          varying float vTerrain;
          ${valueNoiseGLSL}

          void main() {
            vec3 N = normalize(vWorldNormal);
            vec3 V = normalize(cameraPosition - vWorldPosition);
            vec3 L = normalize(vec3(-0.45, 0.72, 0.55));

            float lambert = max(dot(N, L), 0.0);
            float rim = pow(1.0 - max(dot(N, V), 0.0), 3.2);
            float terrain = vTerrain + fbm(vObjectPosition * 12.0) * 0.13;
            float landMask = smoothstep(0.48, 0.60, terrain);

            vec3 ocean = vec3(0.001, 0.007, 0.014);
            vec3 land = vec3(0.008, 0.012, 0.014);
            vec3 base = mix(ocean, land, landMask);

            float cellular = fbm(vObjectPosition * 27.0 + vec3(0.0, uTime * 0.025, 0.0));
            float lineWave = abs(sin((terrain * 27.0 + cellular * 7.5 + uTime * 0.13) * 3.14159));
            float veins = smoothstep(0.955, 0.997, lineWave) * smoothstep(0.43, 0.68, terrain);
            float micro = smoothstep(0.82, 0.97, cellular) * smoothstep(0.52, 0.77, terrain);

            float pulse = 0.55 + 0.45 * sin(uTime * 2.15 + terrain * 18.0);
            vec3 emission = uRed * veins * (1.0 + pulse * 4.2);
            emission += uRedHot * micro * (0.08 + pulse * 0.35);

            float polar = pow(abs(vObjectPosition.y), 8.0);
            float auroraBands = smoothstep(0.4, 0.95, sin(vObjectPosition.x * 15.0 + cellular * 9.0 + uTime) * 0.5 + 0.5);
            emission += uCyan * polar * auroraBands * 0.32;

            vec3 lit = base * (0.15 + lambert * 1.15);
            lit += vec3(0.12, 0.16, 0.2) * pow(max(dot(reflect(-L, N), V), 0.0), 42.0) * (1.0 - landMask);
            lit += emission;
            lit += uRed * rim * 0.13;

            gl_FragColor = vec4(lit, 1.0);
          }
        `
      });

      const planet = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.56, isMobile ? 5 : 6),
        planetMaterial
      );
      planet.userData.rootName = "planet";
      scene.add(planet);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.78, isMobile ? 48 : 80, isMobile ? 32 : 56),
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uRed: { value: new THREE.Color(0xff003c) },
            uCyan: { value: new THREE.Color(0x52f6ff) }
          },
          vertexShader: `
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;
            void main() {
              vec4 world = modelMatrix * vec4(position, 1.0);
              vWorldPosition = world.xyz;
              vWorldNormal = normalize(mat3(modelMatrix) * normal);
              gl_Position = projectionMatrix * viewMatrix * world;
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uRed;
            uniform vec3 uCyan;
            varying vec3 vWorldPosition;
            varying vec3 vWorldNormal;
            void main() {
              vec3 V = normalize(cameraPosition - vWorldPosition);
              float fresnel = pow(1.0 - abs(dot(normalize(vWorldNormal), V)), 2.15);
              float polar = pow(abs(normalize(vWorldNormal).y), 5.0);
              float pulse = 0.78 + 0.22 * sin(uTime * 1.6);
              vec3 color = mix(uRed, uCyan, polar * 0.52);
              gl_FragColor = vec4(color * fresnel * 1.5, fresnel * 0.34 * pulse);
            }
          `
        })
      );
      atmosphere.userData.rootName = "planet";
      scene.add(atmosphere);

      // ---------- AURORA ORBITAL (partículas helicoidales) ----------
      (function createAuroraParticles() {
        var N = isMobile ? 200 : 500;
        var geo = new THREE.BufferGeometry();
        var pos = new Float32Array(N * 3);
        var ph = new Float32Array(N);
        var spd = new Float32Array(N);
        for (var i = 0; i < N; i++) {
          var angle = Math.random() * Math.PI * 2;
          var r = 1.9 + Math.random() * 0.8;
          var y = (Math.random() - 0.5) * 0.6;
          pos[i*3] = Math.cos(angle) * r;
          pos[i*3+1] = y;
          pos[i*3+2] = Math.sin(angle) * r;
          ph[i] = angle;
          spd[i] = 0.3 + Math.random() * 0.7;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
        geo.setAttribute("aSpeed", new THREE.BufferAttribute(spd, 1));
        var mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 } },
          vertexShader: `
            attribute float aPhase; attribute float aSpeed;
            uniform float uTime;
            varying float vAlpha; varying vec3 vCol;
            void main() {
              float t = uTime * aSpeed * 0.4 + aPhase;
              float r = 1.9 + sin(t * 2.0) * 0.3;
              float y = position.y + sin(t * 3.0 + aPhase * 5.0) * 0.4;
              vec3 p = vec3(cos(t) * r, y, sin(t) * r);
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              float polar = abs(y) / 1.0;
              vCol = mix(vec3(1.0, 0.04, 0.12), vec3(0.2, 0.9, 1.0), polar);
              vAlpha = (0.4 + 0.6 * sin(t * 5.0 + aPhase)) * smoothstep(8.0, 2.0, -mv.z);
              gl_PointSize = (1.5 + polar * 2.0) * (100.0 / max(1.0, -mv.z));
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            varying float vAlpha; varying vec3 vCol;
            void main() {
              float d = length(gl_PointCoord - 0.5);
              float a = exp(-d * 6.0) * vAlpha * 0.4;
              if (a < 0.01) discard;
              gl_FragColor = vec4(vCol, a);
            }
          `
        });
        var pts = new THREE.Points(geo, mat);
        pts.userData.auroraMat = mat;
        scene.add(pts);
      })();

      // ---------- PLANETAS DISTANTES ----------
      function createDistantPlanet(radius, detail, colorA, colorB, colorC, pos, rotSpeed) {
        const u = {
          uTime: { value: 0 },
          uRed: { value: new THREE.Color(colorA) },
          uRedHot: { value: new THREE.Color(colorB) },
          uCyan: { value: new THREE.Color(colorC) }
        };
        const mat = new THREE.ShaderMaterial({
          uniforms: u,
          vertexShader: planetMaterial.vertexShader,
          fragmentShader: planetMaterial.fragmentShader
        });
        const mesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(radius, detail),
          mat
        );
        mesh.position.set(pos[0], pos[1], pos[2]);

        const atmoMat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uRed: { value: new THREE.Color(colorA) },
            uCyan: { value: new THREE.Color(colorC) }
          },
          vertexShader: atmosphere.material.vertexShader,
          fragmentShader: atmosphere.material.fragmentShader
        });
        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(radius * 1.14, 32, 24),
          atmoMat
        );
        atmo.position.copy(mesh.position);

        scene.add(mesh, atmo);
        return { mesh, atmo, uniforms: u, atmoUniforms: atmoMat.uniforms, rotSpeed };
      }

      const distantPlanets = [
        createDistantPlanet(0.7, isMobile ? 3 : 4,
          0x2288ff, 0x88ccff, 0x44eeff,
          [-18, 3, -28], 0.04),
        createDistantPlanet(0.45, isMobile ? 3 : 4,
          0x9922ff, 0xcc66ff, 0xff44dd,
          [22, -2, -35], -0.03),
        createDistantPlanet(0.55, isMobile ? 3 : 4,
          0x22ff66, 0x88ffaa, 0x44ffcc,
          [-12, -5, -42], 0.025)
      ];

      distantPlanets.forEach(dp => {
        const glow = createGlowSprite(
          dp.uniforms.uRed.value.getHex(), dp.mesh.geometry.parameters.radius * 4, 0.12
        );
        glow.position.copy(dp.mesh.position);
        glow.position.z -= 0.5;
        scene.add(glow);
        dp.glow = glow;
      });

      // ---------- RELÍQUIAS DISTANTES ----------
      function createDistantRelic(buildFn, position, scale, rotSpeed) {
        const group = new THREE.Group();
        const metalMat = (c = 0xb9a46c) => new THREE.MeshPhysicalMaterial({
          color: c, metalness: 0.93, roughness: 0.17, clearcoat: 1, clearcoatRoughness: 0.08
        });
        const glassMat = (c = 0xffffff, o = 0.28) => new THREE.MeshPhysicalMaterial({
          color: c, metalness: 0.05, roughness: 0.07, transmission: 0.92,
          thickness: 0.55, ior: 1.5, transparent: true, opacity: o, clearcoat: 1
        });
        const darkMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.72, roughness: 0.28 });
        const helper = {
          mesh: (g, m, p = [0,0,0], r = [0,0,0], s = [1,1,1]) => {
            const x = new THREE.Mesh(g, m); x.position.set(...p); x.rotation.set(...r); x.scale.set(...s); group.add(x); return x;
          },
          tube: (pts, r = 0.06, mat) => {
            const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
            return helper.mesh(new THREE.TubeGeometry(c, 48, r, 8, false), mat || metalMat());
          },
          sphere: (r, m, p) => helper.mesh(new THREE.SphereGeometry(r, 32, 24), m, p),
          torus: (R, r, m, p, rot) => helper.mesh(new THREE.TorusGeometry(R, r, 16, 64), m, p, rot),
          box: (w, h, d, m, p, r) => helper.mesh(new THREE.BoxGeometry(w, h, d), m, p, r),
          metal: metalMat, glass: glassMat, dark: darkMat
        };
        buildFn(helper);
        group.position.set(...position);
        group.scale.setScalar(scale);
        scene.add(group);
        return { group, rotSpeed };
      }

      const distantRelics = [
        createDistantRelic(h => {
          h.mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.5, 16), h.metal(0xcdd3d6), [0,0.15,0], [0,0,0.35]);
          h.torus(0.17, 0.035, h.metal(0xcdd3d6), [-0.57, 1.66, 0], [Math.PI/2, 0, 0.35]);
          const pts = []; for (let i = 0; i < 12; i++) pts.push([-0.5+i*0.16, 1.5-Math.sin(i*0.7)*0.35, 0.08]);
          h.tube(pts, 0.018, new THREE.MeshPhysicalMaterial({ color: 0x8b0013, roughness: 0.5 }));
        }, [14, 5, -22], 0.8, 0.012),

        createDistantRelic(h => {
          h.torus(1.25, 0.09, h.metal(0xc6a65b), [0, 0.25, 0]);
          const mirror = h.sphere(1.12, h.glass(0xcbd6df, 0.38), [0, 0.25, 0]);
          mirror.scale.z = 0.07;
          h.tube([[-1.05,-0.65,0], [-1.35,-1.15,0], [-0.9,-1.55,0]], 0.045, h.metal(0x8a6a38));
        }, [-16, -3, -30], 0.6, -0.009),

        createDistantRelic(h => {
          const eyeball = h.sphere(1.22, new THREE.MeshPhysicalMaterial({ color: 0xd8d0c6, roughness: 0.42, clearcoat: 0.2 }), [0, 0.15, 0]);
          eyeball.scale.set(1.45, 0.72, 0.55);
          h.sphere(0.48, new THREE.MeshPhysicalMaterial({ color: 0x5b311c, roughness: 0.2, clearcoat: 1 }), [0, 0.15, 0.55]);
          h.sphere(0.20, h.dark, [0, 0.15, 0.93]);
        }, [20, 2, -38], 0.5, 0.015),

        createDistantRelic(h => {
          const m = h.metal(0xc4a34f);
          h.torus(1.05, 0.12, m, [0, -0.3, 0], [Math.PI/2, 0, 0]);
          for (let i = 0; i < 7; i++) {
            const a = i / 7 * Math.PI * 2;
            h.box(0.18, 1.35, 0.18, m, [Math.cos(a)*0.9, 0.25, Math.sin(a)*0.9], [0, -a, 0.15*Math.sin(i)]);
          }
        }, [-24, 6, -45], 0.45, -0.007),

        createDistantRelic(h => {
          const mat = new THREE.MeshPhysicalMaterial({ color: 0x65000c, roughness: 0.2, metalness: 0.05, clearcoat: 1 });
          h.sphere(0.72, mat, [-0.45, 0.35, 0]);
          h.sphere(0.72, mat, [0.45, 0.35, 0]);
          h.mesh(new THREE.ConeGeometry(0.95, 1.8, 48), mat, [0, -0.45, 0], [0, 0, Math.PI]);
        }, [18, -4, -50], 0.55, 0.01),

        createDistantRelic(h => {
          const face = h.sphere(1.12, new THREE.MeshPhysicalMaterial({ color: 0xe8e1d8, roughness: 0.32, clearcoat: 0.5 }), [0, 0.2, 0]);
          face.scale.set(0.78, 1, 0.28);
          h.box(0.34, 0.12, 0.5, h.dark, [-0.38, 0.4, 0.16]);
          h.box(0.34, 0.12, 0.5, h.dark, [0.38, 0.4, 0.16]);
        }, [-28, 2, -55], 0.5, -0.011),

        createDistantRelic(h => {
          h.box(2.2, 1.0, 0.42, h.dark, [0, 0.1, 0]);
          h.box(0.72, 0.74, 0.28, h.metal(0xb8b8b8), [1.42, 0.1, 0]);
          h.box(0.16, 0.16, 0.08, h.dark, [1.62, 0.26, 0.19]);
          h.box(0.16, 0.16, 0.08, h.dark, [1.62, -0.06, 0.19]);
        }, [25, -6, -58], 0.45, 0.013),

        createDistantRelic(h => {
          h.tube([[0,-1.4,0],[0.05,-0.4,0],[-0.1,0.65,0]], 0.055, new THREE.MeshStandardMaterial({ color: 0x1f5d25, roughness: 0.8 }));
          for (var i = 0; i < 6; i++) {
            var a = i / 6 * Math.PI * 2;
            h.mesh(new THREE.SphereGeometry(0.68, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0x9b061d, roughness: 0.42, clearcoat: 0.35 }),
              [Math.cos(a)*0.45, 0.88+Math.sin(a)*0.12, Math.sin(a)*0.45], [0,0,a], [1.1,0.45,0.32]);
          }
          h.sphere(0.2, h.dark, [0, 0.92, 0]);
        }, [-8, 8, -62], 0.6, -0.008),

        createDistantRelic(h => {
          var bloodMat = new THREE.MeshPhysicalMaterial({ color: 0x520006, roughness: 0.08, metalness: 0, transmission: 0.06, clearcoat: 1 });
          var drop = h.sphere(0.92, bloodMat, [0, 0.25, 0]);
          drop.scale.set(0.72, 1.35, 0.72);
          var redmat = new THREE.MeshPhysicalMaterial({ color: 0x5d000d, metalness: 0.12, roughness: 0.23, clearcoat: 1 });
          h.sphere(0.32, redmat, [0.8, -0.62, 0.1]);
          h.sphere(0.2, redmat, [-0.72, -0.95, -0.1]);
        }, [30, 0, -68], 0.5, 0.009)
      ];

      // ---------- MÁQUINA VIVA ----------
      const machine = new THREE.Group();
      machine.userData.rootName = "machine";
      scene.add(machine);

      const machineMetal = new THREE.MeshPhysicalMaterial({
        color: 0x09090d,
        metalness: 0.96,
        roughness: 0.24,
        clearcoat: 0.78,
        clearcoatRoughness: 0.2,
        emissive: 0xff003c,
        emissiveIntensity: 1.65,
        envMapIntensity: 1.5
      });

      const machineDark = new THREE.MeshStandardMaterial({
        color: 0x030305,
        metalness: 0.88,
        roughness: 0.34,
        emissive: 0x410010,
        emissiveIntensity: 1.2
      });

      const ringData = [
        { r: 2.16, tube: 0.025, rot: [0.62, 0.18, 0.0], speed: 0.105 },
        { r: 2.60, tube: 0.032, rot: [-0.32, 0.38, 0.46], speed: -0.075 },
        { r: 3.02, tube: 0.018, rot: [0.12, -0.52, 0.22], speed: 0.052 }
      ];

      const machineRings = ringData.map((data, index) => {
        const mesh = new THREE.Mesh(
          new THREE.TorusGeometry(data.r, data.tube, 8, isMobile ? 96 : 180),
          index === 1 ? machineMetal : machineDark
        );
        mesh.rotation.set(...data.rot);
        mesh.userData.speed = data.speed;
        mesh.userData.rootName = "machine";
        machine.add(mesh);
        return mesh;
      });

      const segmentCount = isMobile ? 24 : 36;
      const segmentGeometry = new THREE.BoxGeometry(0.34, 0.115, 0.72);
      segmentGeometry.translate(0, 0, 0.2);
      const segments = new THREE.InstancedMesh(segmentGeometry, machineMetal, segmentCount);
      segments.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      segments.userData.rootName = "machine";
      machine.add(segments);

      const spikeGeometry = new THREE.ConeGeometry(0.055, 0.48, 6);
      spikeGeometry.rotateZ(Math.PI / 2);
      const spikes = new THREE.InstancedMesh(spikeGeometry, machineDark, segmentCount);
      spikes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      spikes.userData.rootName = "machine";
      machine.add(spikes);

      const dummy = new THREE.Object3D();
      function updateMachineInstances(time) {
        for (let i = 0; i < segmentCount; i++) {
          const angle = (i / segmentCount) * Math.PI * 2;
          const breath = Math.sin(time * 1.45 + i * 0.39);
          const radius = 2.72 + breath * 0.085;
          const z = Math.sin(time * 0.7 + i * 0.71) * 0.12;

          dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
          dummy.rotation.set(0, 0, angle + Math.PI / 2);
          dummy.scale.set(0.72 + (breath + 1) * 0.14, 1, 1 + (breath + 1) * 0.08);
          dummy.updateMatrix();
          segments.setMatrixAt(i, dummy.matrix);

          const spikeRadius = 2.42 + breath * 0.04;
          dummy.position.set(Math.cos(angle) * spikeRadius, Math.sin(angle) * spikeRadius, z * 0.6);
          dummy.rotation.set(0, 0, angle);
          dummy.scale.set(0.8, 0.7 + (breath + 1) * 0.18, 0.8);
          dummy.updateMatrix();
          spikes.setMatrixAt(i, dummy.matrix);
        }
        segments.instanceMatrix.needsUpdate = true;
        spikes.instanceMatrix.needsUpdate = true;
      }
      updateMachineInstances(0);

      // Iris orgánico.
      const iris = new THREE.Group();
      machine.add(iris);
      const irisPetals = [];
      for (let i = 0; i < 14; i++) {
        const pivot = new THREE.Group();
        pivot.rotation.z = (i / 14) * Math.PI * 2;
        const petal = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.82, 0.055),
          i % 2 ? machineMetal : machineDark
        );
        petal.position.y = 1.98;
        petal.rotation.z = 0.22;
        petal.userData.rootName = "machine";
        pivot.add(petal);
        iris.add(pivot);
        irisPetals.push(pivot);
      }

      // ---------- TEXTURAS PROCEDURALES ----------
      function createMetalMicroTexture() {
        const size = 512;
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d");
        const image = ctx.createImageData(size, size);

        for (let i = 0; i < image.data.length; i += 4) {
          const n = 110 + Math.random() * 90;
          image.data[i] = n;
          image.data[i + 1] = n;
          image.data[i + 2] = n;
          image.data[i + 3] = 255;
        }
        ctx.putImageData(image, 0, 0);
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 180; i++) {
          const y = Math.random() * size;
          ctx.strokeStyle = Math.random() > 0.5 ? "#fff" : "#000";
          ctx.lineWidth = Math.random() * 0.8 + 0.2;
          ctx.beginPath();
          ctx.moveTo(Math.random() * 80, y);
          ctx.lineTo(size - Math.random() * 80, y + Math.random() * 2);
          ctx.stroke();
        }
        const texture = new THREE.CanvasTexture(c);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2.2, 5.0);
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return texture;
      }

      const metalMicro = createMetalMicroTexture();

      // ---------- LLAVE DORADA PBR ----------
      const key = new THREE.Group();
      key.position.set(4.15, 0.12, 0.32);
      key.rotation.set(-0.12, -0.26, 0.18);
      key.scale.setScalar(0.94);
      key.userData.rootName = "key";
      scene.add(key);

      const goldMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffc84f,
        metalness: 1,
        roughness: 0.19,
        clearcoat: 0.7,
        clearcoatRoughness: 0.12,
        anisotropy: 0.42,
        envMapIntensity: 2.15,
        emissive: 0x5b2600,
        emissiveIntensity: 0.18,
        roughnessMap: metalMicro,
        bumpMap: metalMicro,
        bumpScale: 0.012
      });

      const goldDark = new THREE.MeshPhysicalMaterial({
        color: 0x7d4307,
        metalness: 1,
        roughness: 0.31,
        clearcoat: 0.35,
        envMapIntensity: 1.7
      });

      function keyMesh(geometry, material = goldMaterial) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.rootName = "key";
        key.add(mesh);
        return mesh;
      }

      const bow = keyMesh(new THREE.TorusGeometry(0.62, 0.115, 20, 96));
      bow.position.y = 1.0;

      const innerBow = keyMesh(new THREE.TorusGeometry(0.33, 0.035, 12, 72), goldDark);
      innerBow.position.y = 1.0;

      const shaft = keyMesh(new THREE.CylinderGeometry(0.115, 0.145, 2.45, 40));
      shaft.position.y = -0.38;

      const collarTop = keyMesh(new THREE.TorusGeometry(0.18, 0.055, 12, 48));
      collarTop.rotation.x = Math.PI / 2;
      collarTop.position.y = 0.26;

      const collarBottom = keyMesh(new THREE.TorusGeometry(0.16, 0.045, 12, 48), goldDark);
      collarBottom.rotation.x = Math.PI / 2;
      collarBottom.position.y = -1.26;

      const toothA = keyMesh(new THREE.BoxGeometry(0.58, 0.24, 0.26));
      toothA.position.set(0.22, -1.48, 0);

      const toothB = keyMesh(new THREE.BoxGeometry(0.36, 0.29, 0.26));
      toothB.position.set(-0.02, -1.72, 0);

      const toothC = keyMesh(new THREE.BoxGeometry(0.24, 0.23, 0.26), goldDark);
      toothC.position.set(0.24, -1.9, 0);

      // Runas geométricas: pequeños remaches y halo.
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const stud = keyMesh(new THREE.SphereGeometry(0.025, 10, 8), i % 3 === 0 ? goldDark : goldMaterial);
        stud.position.set(Math.cos(a) * 0.46, 1.0 + Math.sin(a) * 0.46, 0.108);
      }

      const keyHalo = keyMesh(
        new THREE.TorusGeometry(0.92, 0.011, 6, 120),
        new THREE.MeshBasicMaterial({
          color: 0xffd45c,
          transparent: true,
          opacity: 0.66,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false
        })
      );
      keyHalo.position.y = 1.0;

      // ---------- DIAMANTE DE TALLA BRILLANTE ----------
      function createBrilliantGeometry() {
        const triangles = [];
        const table = [];
        const crown = [];
        const girdleTop = [];
        const girdleBottom = [];
        const lower = [];

        function ring(count, radius, y, phase = 0) {
          const result = [];
          for (let i = 0; i < count; i++) {
            const a = phase + (i / count) * Math.PI * 2;
            result.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
          }
          return result;
        }

        table.push(...ring(8, 0.39, 0.62, Math.PI / 8));
        crown.push(...ring(16, 1.0, 0.18, Math.PI / 16));
        girdleTop.push(...ring(16, 1.035, 0.08, Math.PI / 16));
        girdleBottom.push(...ring(16, 1.035, 0.01, Math.PI / 16));
        lower.push(...ring(8, 0.58, -0.56, Math.PI / 8));

        function tri(a, b, c) {
          triangles.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        }

        const topCenter = new THREE.Vector3(0, 0.62, 0);
        for (let i = 0; i < 8; i++) {
          tri(topCenter, table[i], table[(i + 1) % 8]);

          const c0 = crown[(i * 2) % 16];
          const c1 = crown[(i * 2 + 1) % 16];
          const c2 = crown[(i * 2 + 2) % 16];
          tri(table[i], c0, c1);
          tri(table[i], c1, table[(i + 1) % 8]);
          tri(table[(i + 1) % 8], c1, c2);
        }

        for (let i = 0; i < 16; i++) {
          const next = (i + 1) % 16;
          tri(crown[i], girdleTop[i], girdleTop[next]);
          tri(crown[i], girdleTop[next], crown[next]);
          tri(girdleTop[i], girdleBottom[i], girdleBottom[next]);
          tri(girdleTop[i], girdleBottom[next], girdleTop[next]);
        }

        for (let i = 0; i < 8; i++) {
          const o0 = girdleBottom[(i * 2) % 16];
          const o1 = girdleBottom[(i * 2 + 1) % 16];
          const o2 = girdleBottom[(i * 2 + 2) % 16];
          const l0 = lower[i];
          const l1 = lower[(i + 1) % 8];
          tri(o0, o1, l0);
          tri(o1, l1, l0);
          tri(o1, o2, l1);
        }

        const culet = new THREE.Vector3(0, -1.28, 0);
        for (let i = 0; i < 8; i++) {
          tri(lower[i], lower[(i + 1) % 8], culet);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(triangles, 3));
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
        return geometry;
      }

      const diamondMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xeaffff,
        metalness: 0,
        roughness: 0.015,
        transmission: 1,
        thickness: 1.7,
        ior: 2.417,
        dispersion: 0.48,
        clearcoat: 1,
        clearcoatRoughness: 0.015,
        iridescence: 0.13,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [90, 260],
        attenuationColor: new THREE.Color(0xc9fbff),
        attenuationDistance: 4.5,
        envMapIntensity: 2.5,
        side: THREE.DoubleSide
      });

      const diamond = new THREE.Mesh(createBrilliantGeometry(), diamondMaterial);
      diamond.position.set(-4.05, 0.22, 0.35);
      diamond.rotation.set(0.08, 0.18, -0.08);
      diamond.scale.setScalar(1.12);
      diamond.userData.rootName = "diamond";
      scene.add(diamond);

      const diamondWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(diamond.geometry, 14),
        new THREE.LineBasicMaterial({
          color: 0xcaffff,
          transparent: true,
          opacity: 0.11,
          blending: THREE.AdditiveBlending
        })
      );
      diamondWire.position.copy(diamond.position);
      diamondWire.rotation.copy(diamond.rotation);
      diamondWire.scale.copy(diamond.scale);
      diamondWire.userData.rootName = "diamond";
      scene.add(diamondWire);

      // ---------- HALOS Y POLVO LOCAL ----------
      function createGlowSprite(color, size, opacity = 0.8) {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const ctx = c.getContext("2d");
        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        const css = `#${new THREE.Color(color).getHexString()}`;
        g.addColorStop(0, "rgba(255,255,255,.95)");
        g.addColorStop(0.05, css);
        g.addColorStop(0.24, css + "88");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(c);
        const material = new THREE.SpriteMaterial({
          map: texture,
          color,
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(size, size, 1);
        return sprite;
      }

      const planetGlow = createGlowSprite(0xff003c, 5.8, 0.22);
      planetGlow.position.set(0, 0, -0.9);
      scene.add(planetGlow);

      const keyGlow = createGlowSprite(0xffc84f, 3.6, 0.2);
      keyGlow.position.set(4.15, 0.65, -0.5);
      scene.add(keyGlow);

      const diamondGlow = createGlowSprite(0x91f9ff, 3.8, 0.18);
      diamondGlow.position.set(-4.05, 0.25, -0.45);
      scene.add(diamondGlow);

      function createOrbitDust(center, color, count, radiusMin, radiusMax) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const phases = new Float32Array(count);

        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = THREE.MathUtils.lerp(radiusMin, radiusMax, Math.random());
          positions[i * 3] = center.x + Math.cos(a) * r;
          positions[i * 3 + 1] = center.y + (Math.random() - 0.5) * r * 0.55;
          positions[i * 3 + 2] = center.z + Math.sin(a) * r * 0.42;
          phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) },
            uPixelRatio: { value: currentDpr }
          },
          vertexShader: `
            attribute float aPhase;
            uniform float uTime;
            uniform float uPixelRatio;
            varying float vAlpha;
            void main() {
              vec3 p = position;
              p.y += sin(uTime * 0.8 + aPhase) * 0.035;
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              vAlpha = 0.45 + 0.55 * sin(uTime * 1.3 + aPhase);
              gl_PointSize = 1.8 * uPixelRatio * (170.0 / max(1.0, -mv.z));
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            varying float vAlpha;
            void main() {
              float d = length(gl_PointCoord - 0.5);
              float a = smoothstep(0.5, 0.0, d) * vAlpha;
              gl_FragColor = vec4(uColor, a);
            }
          `
        });

        const points = new THREE.Points(geometry, material);
        points.userData.material = material;
        return points;
      }

      const keyDust = createOrbitDust(new THREE.Vector3(4.15, 0.2, 0.3), 0xffd45c, isMobile ? 50 : 100, 1.05, 1.85);
      const diamondDust = createOrbitDust(new THREE.Vector3(-4.05, 0.15, 0.3), 0x9dfaff, isMobile ? 50 : 100, 1.0, 1.8);
      scene.add(keyDust, diamondDust);

      // ---------- ANEL DE ENERGIA (SATURN-LIKE) ----------
      const ringGeometry = new THREE.RingGeometry(2.2, 3.4, isMobile ? 64 : 128, 1);
      const ringMaterial = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uRed: { value: new THREE.Color(0xff003c) },
          uGold: { value: new THREE.Color(0xffd45c) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uRed;
          uniform vec3 uGold;
          varying vec2 vUv;
          void main() {
            float radial = abs(vUv.x - 0.5) * 2.0;
            float edge = smoothstep(1.0, 0.7, radial) * smoothstep(0.0, 0.15, radial);
            float bands = sin(vUv.y * 62.83 + uTime * 0.8) * 0.5 + 0.5;
            bands = pow(bands, 3.0) * 0.6 + 0.4;
            float shimmer = sin(vUv.y * 251.3 - uTime * 2.2) * 0.5 + 0.5;
            vec3 color = mix(uRed, uGold, smoothstep(0.3, 0.8, radial) + shimmer * 0.15);
            float alpha = edge * bands * (0.12 + shimmer * 0.06);
            float pulse = 0.85 + 0.15 * sin(uTime * 1.3);
            gl_FragColor = vec4(color * 1.4, alpha * pulse);
          }
        `
      });
      const energyRing = new THREE.Mesh(ringGeometry, ringMaterial);
      energyRing.rotation.x = -Math.PI * 0.47;
      energyRing.rotation.z = 0.12;
      energyRing.userData.rootName = "planet";
      scene.add(energyRing);

      // ---------- LINHAS DE ENERGIA ENTRE OBJETOS ----------
      const connectionCount = isMobile ? 3 : 5;
      const connections = [];
      const connectionPairs = [
        { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(4.15, 0.12, 0.32), color: 0xffd45c },
        { from: new THREE.Vector3(0, 0, 0), to: new THREE.Vector3(-4.05, 0.22, 0.35), color: 0x65f7ff }
      ];

      connectionPairs.forEach(({ from, to, color }) => {
        const points = [];
        for (let i = 0; i <= 48; i++) {
          const t = i / 48;
          points.push(new THREE.Vector3(
            THREE.MathUtils.lerp(from.x, to.x, t),
            THREE.MathUtils.lerp(from.y, to.y, t) + Math.sin(t * Math.PI) * 0.6,
            THREE.MathUtils.lerp(from.z, to.z, t)
          ));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
        const material = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color(color) }
          },
          vertexShader: `
            attribute float lineDistance;
            varying float vDist;
            uniform float uTime;
            void main() {
              vDist = position.x * 0.1 + position.z * 0.1;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            uniform vec3 uColor;
            varying float vDist;
            void main() {
              float flow = fract(vDist * 2.0 - uTime * 0.5);
              float pulse = pow(flow, 8.0) * 0.7 + 0.05;
              float flicker = 0.7 + 0.3 * sin(uTime * 3.0 + vDist * 20.0);
              gl_FragColor = vec4(uColor * 1.5, pulse * flicker * 0.35);
            }
          `
        });
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        connections.push({ line, material });
      });

      // ---------- RED DE ENERGÍA PROFUNDA (conecta reliquias distantes) ----------
      (function createDeepEnergyWeb() {
        var nodes = [
          [0,0,0], [-18,3,-28], [22,-2,-35], [-12,-5,-42],
          [14,5,-22], [-16,-3,-30], [20,2,-38], [-24,6,-45], [18,-4,-50],
          [-28,2,-55], [25,-6,-58], [-8,8,-62], [30,0,-68]
        ];
        var pairs = [];
        for (var i = 0; i < nodes.length; i++) {
          for (var j = i + 1; j < nodes.length; j++) {
            var dx = nodes[i][0]-nodes[j][0], dy = nodes[i][1]-nodes[j][1], dz = nodes[i][2]-nodes[j][2];
            if (Math.sqrt(dx*dx+dy*dy+dz*dz) < 35) pairs.push([i, j]);
          }
        }
        var verts = []; var indices = [];
        pairs.forEach(function(pr) {
          var a = nodes[pr[0]], b = nodes[pr[1]];
          var base = verts.length / 3;
          for (var k = 0; k <= 16; k++) {
            var t = k / 16;
            verts.push(
              a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t + Math.sin(t*Math.PI)*2, a[2]+(b[2]-a[2])*t
            );
            if (k < 16) { indices.push(base+k, base+k+1); }
          }
        });
        var geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
        geo.setIndex(indices);
        var mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 } },
          vertexShader: `
            uniform float uTime;
            varying float vFlow;
            void main() {
              vFlow = position.x * 0.04 + position.z * 0.03 + position.y * 0.05;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying float vFlow;
            void main() {
              float pulse = pow(fract(vFlow - uTime * 0.3), 12.0) * 0.7;
              float flicker = 0.5 + 0.5 * sin(uTime * 2.0 + vFlow * 15.0);
              vec3 col = vec3(0.9, 0.12, 0.2) * pulse * flicker + vec3(0.1, 0.03, 0.08) * 0.05;
              gl_FragColor = vec4(col, pulse * flicker * 0.18);
            }
          `
        });
        var web = new THREE.LineSegments(geo, mat);
        web.userData.deepWebMat = mat;
        scene.add(web);
      })();

      // ---------- PULSO ELECTROMAGNÉTICO (onda esférica periódica) ----------
      (function createEMPulse() {
        var geo = new THREE.SphereGeometry(1, 64, 32);
        var mat = new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 } },
          vertexShader: `
            uniform float uTime;
            varying vec3 vPos;
            void main() {
              float wave = mod(uTime * 0.15, 1.0);
              float radius = wave * 80.0;
              vec3 p = position * radius;
              vPos = p;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uTime;
            varying vec3 vPos;
            void main() {
              float wave = mod(uTime * 0.15, 1.0);
              float radius = wave * 80.0;
              float edge = 1.0 - wave;
              float d = length(vPos) / max(radius, 0.1);
              float ring = exp(-pow((d - 0.98) * 50.0, 2.0)) * edge;
              vec3 col = mix(vec3(1.0, 0.05, 0.15), vec3(0.3, 0.0, 0.5), wave);
              gl_FragColor = vec4(col * ring * 2.0, ring * 0.12);
            }
          `
        });
        var pulse = new THREE.Mesh(geo, mat);
        pulse.userData.emPulseMat = mat;
        scene.add(pulse);
      })();

      // ---------- INTERAÇÃO / CÂMARA ----------
      const focusPresets = {
        all: {
          position: new THREE.Vector3(0, 0.24, isMobile ? 12.8 : 10.8),
          target: new THREE.Vector3(0, 0, 0)
        },
        planet: {
          position: new THREE.Vector3(0.2, 0.12, isMobile ? 7.0 : 5.9),
          target: new THREE.Vector3(0, 0, 0)
        },
        machine: {
          position: new THREE.Vector3(0.2, 2.15, isMobile ? 8.2 : 7.2),
          target: new THREE.Vector3(0, 0, 0)
        },
        key: {
          position: new THREE.Vector3(4.15, 0.25, isMobile ? 6.2 : 4.9),
          target: new THREE.Vector3(4.15, 0.08, 0.18)
        },
        diamond: {
          position: new THREE.Vector3(-4.05, 0.25, isMobile ? 6.1 : 4.7),
          target: new THREE.Vector3(-4.05, 0.12, 0.18)
        }
      };

      let activeFocus = "all";
      const desiredPosition = focusPresets.all.position.clone();
      const desiredTarget = focusPresets.all.target.clone();
      const currentTarget = desiredTarget.clone();
      const mouse = new THREE.Vector2();
      const mouseSmooth = new THREE.Vector2();
      const raycaster = new THREE.Raycaster();
      let hoveredRoot = "";
      let lastPointerClient = { x: innerWidth / 2, y: innerHeight / 2 };

      function setFocus(name) {
        if (!focusPresets[name]) return;
        activeFocus = name;
        desiredPosition.copy(focusPresets[name].position);
        desiredTarget.copy(focusPresets[name].target);

        const c = canvas;
        c.classList.add("transitioning");
        setTimeout(() => c.classList.remove("transitioning"), 600);

        document.querySelectorAll("[data-focus]").forEach((element) => {
          element.classList.toggle("active", element.dataset.focus === name);
        });

        const titles = {
          all: ["Organic Machine", "Todos os sistemas sincronizados numa única cena."],
          diamond: ["Spectral Diamond", "Transmissão física, IOR 2.417 e dispersão cromática."],
          planet: ["Living Planet", "Superfície procedural, respiração e veias bioelétricas."],
          machine: ["Alive Machine", "Íris, anéis e placas metálicas com pulso orgânico."],
          key: ["Golden Key", "Metal PBR, microarranhões e energia ritual dourada."]
        };

        const [title, subtitle] = titles[name];
        document.querySelector(".panel-title").textContent = title;
        document.querySelector(".panel-subtitle").textContent = subtitle;
      }

      document.querySelectorAll("[data-focus]").forEach((element) => {
        element.addEventListener("click", () => setFocus(element.dataset.focus));
      });

      function updatePointer(event) {
        lastPointerClient = { x: event.clientX, y: event.clientY };
        mouse.x = (event.clientX / innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / innerHeight) * 2 + 1;

        document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
        document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      }

      addEventListener("pointermove", updatePointer, { passive: true });

      canvas.addEventListener("pointerup", () => {
        if (hoveredRoot) setFocus(hoveredRoot);
      });

      const clickable = [
        diamond,
        diamondWire,
        planet,
        atmosphere,
        ...key.children,
        ...machine.children
      ];

      // ---------- NAVEGAÇÃO POR TECLADO ----------
      const focusOrder = ["all", "planet", "diamond", "key", "machine"];
      addEventListener("keydown", (e) => {
        if (document.getElementById("codex").classList.contains("open")) return;
        const keyMap = { "1": "all", "2": "planet", "3": "diamond", "4": "key", "5": "machine" };
        if (keyMap[e.key]) { setFocus(keyMap[e.key]); return; }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const idx = focusOrder.indexOf(activeFocus);
          setFocus(focusOrder[(idx + 1) % focusOrder.length]);
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const idx = focusOrder.indexOf(activeFocus);
          setFocus(focusOrder[(idx - 1 + focusOrder.length) % focusOrder.length]);
        }
        if (e.key === "l" || e.key === "L") {
          document.getElementById("codex").classList.toggle("open");
        }
      });

      // ---------- ETIQUETAS 3D → HTML ----------
      const labelData = [
        { element: document.getElementById("label-diamond"), object: diamond, offset: new THREE.Vector3(-0.2, 1.58, 0) },
        { element: document.getElementById("label-planet"), object: planet, offset: new THREE.Vector3(0.2, 1.95, 0) },
        { element: document.getElementById("label-key"), object: key, offset: new THREE.Vector3(0.1, 2.1, 0) }
      ];
      const projected = new THREE.Vector3();

      function updateLabels() {
        if (isMobile) return;
        for (const item of labelData) {
          item.object.getWorldPosition(projected);
          projected.add(item.offset);
          projected.project(camera);
          const visible = projected.z > -1 && projected.z < 1 &&
                          projected.x > -1.2 && projected.x < 1.2 &&
                          projected.y > -1.15 && projected.y < 1.15;

          item.element.classList.toggle("visible", visible);
          item.element.style.transform =
            `translate3d(${(projected.x * 0.5 + 0.5) * innerWidth}px, ${(-projected.y * 0.5 + 0.5) * innerHeight}px, 0) translate(-50%, -50%)`;
        }
      }

      // ---------- AUDIO PROCEDURAL ----------
      let audioContext = null;
      let audioNodes = null;
      let audioEnabled = false;
      const audioBtn = document.getElementById("audioBtn");
      const audioWave = document.getElementById("audioWave");

      async function toggleAudio() {
        if (!audioContext) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          audioContext = new AudioCtx();

          const master = audioContext.createGain();
          master.gain.value = 0.0001;
          master.connect(audioContext.destination);

          const filter = audioContext.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 420;
          filter.Q.value = 1.4;
          filter.connect(master);

          const oscA = audioContext.createOscillator();
          const oscB = audioContext.createOscillator();
          oscA.type = "sine";
          oscB.type = "triangle";
          oscA.frequency.value = 55;
          oscB.frequency.value = 82.41;

          const gainA = audioContext.createGain();
          const gainB = audioContext.createGain();
          gainA.gain.value = 0.65;
          gainB.gain.value = 0.13;

          oscA.connect(gainA).connect(filter);
          oscB.connect(gainB).connect(filter);

          const lfo = audioContext.createOscillator();
          const lfoGain = audioContext.createGain();
          lfo.frequency.value = 0.16;
          lfoGain.gain.value = 60;
          lfo.connect(lfoGain).connect(filter.frequency);

          oscA.start();
          oscB.start();
          lfo.start();

          // --- CELESTIAL CHOIR (center approach) ---
          var choirGain = audioContext.createGain();
          choirGain.gain.value = 0;
          choirGain.connect(master);
          var choirVoices = [216, 432, 648, 864].map(function(f) {
            var osc = audioContext.createOscillator();
            osc.type = "sine";
            osc.frequency.value = f;
            var g = audioContext.createGain();
            g.gain.value = f === 432 ? 0.35 : (f === 216 ? 0.25 : 0.12);
            osc.connect(g).connect(choirGain);
            osc.start();
            return osc;
          });
          var choirLfo = audioContext.createOscillator();
          choirLfo.frequency.value = 0.45;
          var choirLfoG = audioContext.createGain();
          choirLfoG.gain.value = 3;
          choirLfo.connect(choirLfoG);
          choirVoices.forEach(function(v) { choirLfoG.connect(v.frequency); });
          choirLfo.start();

          // --- MOOD OSCILLATORS (spatial per-object) ---
          var moodGain = audioContext.createGain();
          moodGain.gain.value = 0;
          var moodFilter = audioContext.createBiquadFilter();
          moodFilter.type = "bandpass";
          moodFilter.frequency.value = 800;
          moodFilter.Q.value = 2.5;
          moodFilter.connect(moodGain).connect(master);
          var moodOscA = audioContext.createOscillator();
          var moodOscB = audioContext.createOscillator();
          moodOscA.type = "sine";
          moodOscB.type = "triangle";
          moodOscA.frequency.value = 220;
          moodOscB.frequency.value = 330;
          var moodGA = audioContext.createGain();
          var moodGB = audioContext.createGain();
          moodGA.gain.value = 0.5;
          moodGB.gain.value = 0.18;
          moodOscA.connect(moodGA).connect(moodFilter);
          moodOscB.connect(moodGB).connect(moodFilter);
          moodOscA.start();
          moodOscB.start();

          audioNodes = { master, filter, oscA, oscB, lfo, choirGain, moodGain, moodOscA, moodOscB, moodFilter };
        }

        await audioContext.resume();
        audioEnabled = !audioEnabled;
        audioNodes.master.gain.cancelScheduledValues(audioContext.currentTime);
        audioNodes.master.gain.exponentialRampToValueAtTime(
          audioEnabled ? 0.018 : 0.0001,
          audioContext.currentTime + 0.6
        );
        audioBtn.style.color = audioEnabled ? "#ff406c" : "";
        audioWave.style.display = audioEnabled ? "" : "none";
        audioBtn.setAttribute("aria-label", audioEnabled ? "Desativar áudio ambiental" : "Ativar áudio ambiental");
      }

      audioBtn.addEventListener("click", toggleAudio);

      // ---------- AUDIO SPATIAL ZONES ----------
      // mood: [freqA, freqB] — intervalos que evocan la emoción
      // pelea=tritone, amor=3ªmayor, traición=2ªmenor, dolor=7ªmenor,
      // poder=5ªjusta, sacrificio=3ªmenor, misterio=tono entero, digital=octava
      var audioMoods = {
        planet:   { f: [108, 162],   label: "amor" },       // 5ª justa — dos hombres, vínculo
        diamond:  { f: [220, 277.2], label: "amor" },       // 3ª mayor — belleza
        key:      { f: [110, 165],   label: "poder" },      // 5ª justa — autoridad
        machine:  { f: [130.8, 185], label: "industrial" },  // tritono — tensión mecánica
        eye:      { f: [196, 207.7], label: "traición" },   // 2ª menor — Judas
        needle:   { f: [164.8, 293.7], label: "dolor" },    // 7ª menor — herida
        mirror:   { f: [246.9, 277.2], label: "misterio" }, // tono entero — reflejo
        crown:    { f: [196, 293.7], label: "poder" },      // 5ª justa — soberanía
        heart:    { f: [130.8, 164.8], label: "sacrificio" }, // 3ª menor — melancolía
        mask:     { f: [220, 246.9], label: "misterio" },   // tono entero — ocultação
        pendrive: { f: [440, 880],   label: "digital" },    // octava — eco digital
        poppy:    { f: [329.6, 415.3], label: "fragilidad" }, // 3ª mayor — belleza frágil
        blood:    { f: [164.8, 196],  label: "sacrificio" }  // 3ª menor — sangre
      };
      var relicPositions = {
        planet: [0, 0, 0], diamond: [-4.05, 0.12, 0.18], key: [4.15, 0.08, 0.18],
        machine: [0, 1.5, 0], eye: [20, 2, -38], needle: [14, 5, -22],
        mirror: [-16, -3, -30], crown: [-24, 6, -45], heart: [18, -4, -50],
        mask: [-28, 2, -55], pendrive: [25, -6, -58], poppy: [-8, 8, -62], blood: [30, 0, -68]
      };
      var lastMoodZone = "";

      function updateSpatialAudio(camPos) {
        if (!audioEnabled || !audioNodes) return;
        var ctx = audioContext;
        var t = ctx.currentTime;

        // Celestial choir — louder as camera approaches center
        var distCenter = Math.sqrt(camPos.x*camPos.x + camPos.y*camPos.y + camPos.z*camPos.z);
        var choirVol = Math.max(0, 1 - distCenter / 50) * 0.022;
        audioNodes.choirGain.gain.cancelScheduledValues(t);
        audioNodes.choirGain.gain.setTargetAtTime(choirVol, t, 0.8);

        // Find nearest relic
        var nearest = ""; var nearDist = 999;
        for (var name in relicPositions) {
          var p = relicPositions[name];
          var dx = camPos.x-p[0], dy = camPos.y-p[1], dz = camPos.z-p[2];
          var d = Math.sqrt(dx*dx+dy*dy+dz*dz);
          if (d < nearDist) { nearDist = d; nearest = name; }
        }

        // Mood oscillators — fade in when close to a relic
        var moodVol = nearDist < 18 ? Math.max(0, 1 - nearDist/18) * 0.014 : 0;
        audioNodes.moodGain.gain.cancelScheduledValues(t);
        audioNodes.moodGain.gain.setTargetAtTime(moodVol, t, 0.6);

        if (nearest !== lastMoodZone && nearest && audioMoods[nearest]) {
          lastMoodZone = nearest;
          var mood = audioMoods[nearest];
          audioNodes.moodOscA.frequency.setTargetAtTime(mood.f[0], t, 1.2);
          audioNodes.moodOscB.frequency.setTargetAtTime(mood.f[1], t, 1.2);
        }
      }

      // ---------- CALIDAD / PANTALLA COMPLETA ----------
      const qualityBtn = document.getElementById("qualityBtn");
      const qualityOrder = ["auto", "eco", "ultra"];

      function applyQuality() {
        currentDpr = desiredPixelRatio();
        renderer.setPixelRatio(currentDpr);
        if (composer.setPixelRatio) composer.setPixelRatio(currentDpr);
        renderer.setSize(innerWidth, innerHeight, false);
        composer.setSize(innerWidth, innerHeight);

        stars.material.uniforms.uPixelRatio.value = currentDpr;
        keyDust.material.uniforms.uPixelRatio.value = currentDpr;
        diamondDust.material.uniforms.uPixelRatio.value = currentDpr;
        cinematicPass.uniforms.uResolution.value.set(innerWidth * currentDpr, innerHeight * currentDpr);

        bloomPass.strength = qualityMode === "eco" ? 0.72 : qualityMode === "ultra" ? 1.34 : (isMobile ? 0.85 : 1.15);
        cinematicPass.uniforms.uGrain.value = qualityMode === "eco" ? 0.02 : 0.035;
        qualityBtn.title = `Qualidade: ${qualityMode.toUpperCase()}`;
      }

      qualityBtn.addEventListener("click", () => {
        const next = (qualityOrder.indexOf(qualityMode) + 1) % qualityOrder.length;
        qualityMode = qualityOrder[next];
        applyQuality();
      });

      document.getElementById("fullscreenBtn").addEventListener("click", async () => {
        try {
          if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
          else await document.exitFullscreen();
        } catch (error) {
          console.warn("Fullscreen unavailable", error);
        }
      });

      // ---------- RESIZE ----------
      function onResize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        applyQuality();
      }
      addEventListener("resize", onResize, { passive: true });

      // ---------- BOOT ----------
      const boot = document.getElementById("boot");
      const bootBar = document.getElementById("bootBar");
      const bootPercent = document.getElementById("bootPercent");
      const bootStatus = document.getElementById("bootStatus");
      const bootSteps = [
        [12, "Inicializando vazio procedural"],
        [27, "Compilando shaders orgânicos"],
        [44, "Calibrando refração espectral"],
        [61, "Ativando metal PBR"],
        [78, "Sincronizando máquina viva"],
        [91, "Construindo pós-produção"],
        [100, "Sistema Belentani estável"]
      ];

      let bootValue = 0;
      const bootTimer = setInterval(() => {
        bootValue += 1 + Math.random() * 4.2;
        bootValue = Math.min(100, bootValue);
        const step = bootSteps.find(([threshold]) => bootValue <= threshold) || bootSteps.at(-1);
        bootStatus.textContent = step[1];
        bootBar.style.width = `${bootValue}%`;
        bootPercent.textContent = `${String(Math.floor(bootValue)).padStart(3, "0")}%`;

        if (bootValue >= 100) {
          clearInterval(bootTimer);
          setTimeout(() => boot.classList.add("done"), 450);
        }
      }, 58);

      // ---------- TELEMETRÍA ----------
      let frameCount = 0;
      let fpsTime = performance.now();
      const fpsValue = document.getElementById("fpsValue");
      const fpsMeter = document.getElementById("fpsMeter");
      const gpuValue = document.getElementById("gpuValue");
      const pulseValue = document.getElementById("pulseValue");

      function updateTelemetry(now, time) {
        frameCount++;
        if (now - fpsTime >= 650) {
          const fps = Math.round((frameCount * 1000) / (now - fpsTime));
          fpsValue.textContent = Math.min(99, fps);
          fpsMeter.style.setProperty("--value", `${Math.min(100, fps / 60 * 100)}%`);
          gpuValue.textContent = `${Math.round(55 + Math.sin(time * 0.47) * 8 + currentDpr * 7)}%`;
          pulseValue.textContent = `${Math.round(82 + Math.sin(time * 1.35) * 9)}%`;
          frameCount = 0;
          fpsTime = now;
        }
      }

      // ---------- VIAGEM ESPACIAL (90s) ----------
      const journeyWaypoints = [
        // --- ZOOM-IN: galaxia como punto rojo ---
        { t: 0,   pos: [0, 8, 280],   tgt: [0, 0, 0],       label: "" },
        { t: 4,   pos: [0, 6, 220],   tgt: [0, 0, 0],       label: "Um ponto vermelho no vazio..." },
        { t: 10,  pos: [2, 4, 140],   tgt: [0, 0, 0],       label: "Uma galáxia acorda..." },
        { t: 17,  pos: [-1, 3, 80],   tgt: [0, 0, 0],       label: "Entrando no sistema..." },
        { t: 24,  pos: [0, 2, 40],    tgt: [0, 0, 0],       label: "Imersão total" },
        { t: 30,  pos: [0, 1.5, 18],  tgt: [0, 0, 0],       label: "Campo estelar detectado" },
        // --- OBJETOS PRINCIPAIS ---
        { t: 36,  pos: [3, 0.8, 12],  tgt: [0, 0, 0],       label: "Planeta Vivo detectado" },
        { t: 42,  pos: [2, 0.3, 6],   tgt: [0, 0.1, 0],     label: "" },
        { t: 48,  pos: [-1, 1.8, 7],  tgt: [0, 0, 0],       label: "Órbita estabilizada" },
        { t: 54,  pos: [-5, 0.6, 5],  tgt: [-4.05, 0.12, 0.18], label: "Diamante Espectral" },
        { t: 60,  pos: [-3.5, 0.3, 3.2], tgt: [-4.05, 0.2, 0], label: "IOR 2.417 · dispersão cromática" },
        { t: 66,  pos: [1, 1.2, 8],   tgt: [0, 0, 0],       label: "" },
        { t: 72,  pos: [5, 0.5, 5],   tgt: [4.15, 0.08, 0.18], label: "Chave Dourada" },
        { t: 78,  pos: [3.8, 0.2, 3], tgt: [4.15, 0.15, 0], label: "Metal PBR · energia ritual" },
        { t: 84,  pos: [1, 2.8, 8],   tgt: [0, 0, 0],       label: "Máquina Orgânica" },
        { t: 89,  pos: [0.5, 3.2, 6], tgt: [0, 1.5, 0],     label: "Íris · anéis · pulso biológico" },
        // --- PLANETAS DISTANTES ---
        { t: 94,  pos: [-8, 4, -8],   tgt: [-18, 3, -28],   label: "Planeta Azul · hemisfério distante" },
        { t: 100, pos: [10, 0, -12],  tgt: [22, -2, -35],   label: "Planeta Violeta · eco de outra era" },
        { t: 106, pos: [-4, -2, -16], tgt: [-12, -5, -42],  label: "Planeta Tóxico · sinal desconhecido" },
        // --- 5 RELÍQUIAS ORIGINAIS ---
        { t: 111, pos: [12, 5, -16],  tgt: [14, 5, -22],    label: "Agulha Ancestral · fio vermelho" },
        { t: 116, pos: [-13, -1, -24], tgt: [-16, -3, -30], label: "Espelho de Omega · reflexo infinito" },
        { t: 121, pos: [17, 3, -30],  tgt: [20, 2, -38],    label: "Olho do Sistema · tudo vê" },
        { t: 126, pos: [-20, 7, -38], tgt: [-24, 6, -45],   label: "Coroa · soberania do código" },
        { t: 131, pos: [14, -2, -42], tgt: [18, -4, -50],   label: "Coração · pulso original" },
        // --- 4 RELÍQUIAS NOVAS ---
        { t: 136, pos: [-24, 3, -48], tgt: [-28, 2, -55],   label: "Máscara · aparência e ocultação" },
        { t: 141, pos: [21, -4, -50], tgt: [25, -6, -58],   label: "Pendrive · memória forense" },
        { t: 146, pos: [-5, 9, -54],  tgt: [-8, 8, -62],    label: "Amapola · beleza e fragilidade" },
        { t: 151, pos: [26, 2, -60],  tgt: [30, 0, -68],    label: "Sangue · vínculo e sacrifício" },
        // --- REGRESSO ---
        { t: 157, pos: [-2, 1, 10],   tgt: [0, 0, 0],       label: "432 Hz · frequência-raiz" },
        { t: 163, pos: [0, 0.5, 11],  tgt: [0, 0, 0],       label: "Travessia completa." },
        { t: 168, pos: [0, 0.24, isMobile ? 12.8 : 10.8], tgt: [0, 0, 0], label: "" }
      ];

      let journeyActive = false;
      let journeyStart = 0;
      let journeyLabelEl = null;

      function createJourneyOverlay() {
        const overlay = document.createElement("div");
        overlay.id = "journey-overlay";
        overlay.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;display:none";
        overlay.innerHTML = `
          <div style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);
            font:300 1.1rem/1.4 'Inter',system-ui,sans-serif;color:rgba(255,255,255,0.85);
            text-align:center;letter-spacing:0.06em;text-shadow:0 0 12px rgba(255,0,60,0.4);
            transition:opacity 0.8s ease" id="journey-label"></div>
          <button onclick="endJourney()" style="position:absolute;bottom:24px;right:24px;
            background:rgba(255,0,60,0.15);border:1px solid rgba(255,0,60,0.3);color:#fff;
            padding:6px 18px;border-radius:20px;cursor:pointer;pointer-events:auto;
            font:400 0.75rem 'Inter',system-ui,sans-serif;letter-spacing:0.08em;
            backdrop-filter:blur(8px);transition:opacity 0.3s" id="journey-skip">SALTAR VIAGEM</button>
          <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);
            width:200px;height:2px;background:rgba(255,255,255,0.1);border-radius:1px;overflow:hidden">
            <div id="journey-progress" style="height:100%;width:0%;background:linear-gradient(90deg,#ff003c,#ffd45c);
              transition:width 0.3s linear;border-radius:1px"></div>
          </div>`;
        document.body.appendChild(overlay);
        journeyLabelEl = document.getElementById("journey-label");
        return overlay;
      }

      const journeyOverlay = createJourneyOverlay();

      // ---------- CAMERA TRAIL (chispas durante el journey) ----------
      var trailMax = isMobile ? 200 : 500;
      var trailGeo = new THREE.BufferGeometry();
      var trailPos = new Float32Array(trailMax * 3);
      var trailLife = new Float32Array(trailMax);
      var trailSize = new Float32Array(trailMax);
      for (var ti = 0; ti < trailMax; ti++) {
        trailPos[ti*3] = 9999; trailPos[ti*3+1] = 9999; trailPos[ti*3+2] = 9999;
        trailLife[ti] = 0; trailSize[ti] = 0.5 + Math.random() * 1.5;
      }
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      trailGeo.setAttribute("aLife", new THREE.BufferAttribute(trailLife, 1));
      trailGeo.setAttribute("aSize", new THREE.BufferAttribute(trailSize, 1));
      var trailMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {},
        vertexShader: `
          attribute float aLife; attribute float aSize;
          varying float vLife;
          void main() {
            vLife = aLife;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * aLife * (80.0 / max(1.0, -mv.z));
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying float vLife;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = exp(-d * 5.0) * vLife * 0.6;
            if (a < 0.01) discard;
            vec3 col = mix(vec3(1.0, 0.3, 0.15), vec3(0.3, 0.1, 0.4), 1.0 - vLife);
            gl_FragColor = vec4(col, a);
          }
        `
      });
      var trailPoints = new THREE.Points(trailGeo, trailMat);
      trailPoints.frustumCulled = false;
      scene.add(trailPoints);
      var trailHead = 0;
      var lastTrailPos = new THREE.Vector3(9999, 9999, 9999);

      function emitTrailParticle(pos) {
        if (pos.distanceTo(lastTrailPos) < 0.3) return;
        lastTrailPos.copy(pos);
        var p = trailGeo.attributes.position.array;
        p[trailHead*3]   = pos.x + (Math.random()-0.5)*0.4;
        p[trailHead*3+1] = pos.y + (Math.random()-0.5)*0.3;
        p[trailHead*3+2] = pos.z + (Math.random()-0.5)*0.4;
        trailGeo.attributes.aLife.array[trailHead] = 1.0;
        trailHead = (trailHead + 1) % trailMax;
        trailGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.aLife.needsUpdate = true;
      }

      function updateTrail() {
        var life = trailGeo.attributes.aLife.array;
        for (var i = 0; i < trailMax; i++) {
          if (life[i] > 0) { life[i] = Math.max(0, life[i] - 0.008); }
        }
        trailGeo.attributes.aLife.needsUpdate = true;
      }

      function startJourney() {
        journeyActive = true;
        journeyStart = clock.getElapsedTime();
        journeyOverlay.style.display = "block";
        document.querySelector(".hero")?.classList.add("journey-active");
      }

      function endJourney() {
        journeyActive = false;
        journeyOverlay.style.display = "none";
        document.querySelector(".hero")?.classList.remove("journey-active");
        setFocus("all");
      }
      window.endJourney = endJourney;

      function updateJourney(time) {
        const elapsed = time - journeyStart;
        const total = journeyWaypoints[journeyWaypoints.length - 1].t;
        if (elapsed >= total) { endJourney(); return; }

        document.getElementById("journey-progress").style.width = (elapsed / total * 100) + "%";

        let i = 0;
        for (; i < journeyWaypoints.length - 1; i++) {
          if (elapsed < journeyWaypoints[i + 1].t) break;
        }
        const wp0 = journeyWaypoints[i];
        const wp1 = journeyWaypoints[Math.min(i + 1, journeyWaypoints.length - 1)];
        const segDur = wp1.t - wp0.t;
        const rawT = segDur > 0 ? (elapsed - wp0.t) / segDur : 0;
        const t = rawT * rawT * (3 - 2 * rawT);

        desiredPosition.set(
          wp0.pos[0] + (wp1.pos[0] - wp0.pos[0]) * t,
          wp0.pos[1] + (wp1.pos[1] - wp0.pos[1]) * t,
          wp0.pos[2] + (wp1.pos[2] - wp0.pos[2]) * t
        );
        desiredTarget.set(
          wp0.tgt[0] + (wp1.tgt[0] - wp0.tgt[0]) * t,
          wp0.tgt[1] + (wp1.tgt[1] - wp0.tgt[1]) * t,
          wp0.tgt[2] + (wp1.tgt[2] - wp0.tgt[2]) * t
        );

        const label = rawT < 0.5 ? wp0.label : wp1.label;
        if (journeyLabelEl && journeyLabelEl.textContent !== label) {
          journeyLabelEl.style.opacity = "0";
          setTimeout(() => {
            journeyLabelEl.textContent = label;
            journeyLabelEl.style.opacity = label ? "1" : "0";
          }, 400);
        }
      }

      document.querySelectorAll('[data-focus="planet"]').forEach(btn => {
        btn.addEventListener("click", () => {
          if (!journeyActive) startJourney();
        });
      });

      // ---------- CACHE SCENE REFS (evita 6x find() por frame) ----------
      var _deepField = scene.children.find(function(c){ return c.userData && c.userData.deepFieldMat; });
      var _dustObj = scene.children.find(function(c){ return c.userData && c.userData.dustMat; });
      var _auroraObj = scene.children.find(function(c){ return c.userData && c.userData.auroraMat; });
      var _magField = scene.children.find(function(c){ return c.userData && c.userData.magFieldMat; });
      var _deepWeb = scene.children.find(function(c){ return c.userData && c.userData.deepWebMat; });
      var _emPulse = scene.children.find(function(c){ return c.userData && c.userData.emPulseMat; });

      // ---------- CICLO DE VIDA ----------
      let pageVisible = true;
      document.addEventListener("visibilitychange", () => {
        pageVisible = !document.hidden;
        if (pageVisible) clock.getDelta();
      });

      const tempCameraPosition = new THREE.Vector3();
      const tempObjectPosition = new THREE.Vector3();
      let lastRaycast = 0;

      function animate(nowMs) {
        if (!pageVisible) return;

        const time = clock.getElapsedTime();
        const motion = reducedMotion ? 0.18 : 1.0;

        if (journeyActive) {
          updateJourney(time);
          emitTrailParticle(camera.position);
        }
        updateTrail();

        mouseSmooth.lerp(mouse, 0.055);
        currentTarget.lerp(desiredTarget, journeyActive ? 0.08 : 0.052);

        tempCameraPosition.copy(desiredPosition);
        if (!journeyActive) {
          tempCameraPosition.x += mouseSmooth.x * (activeFocus === "all" ? 0.38 : 0.13);
          tempCameraPosition.y += mouseSmooth.y * (activeFocus === "all" ? 0.24 : 0.09);
        }
        camera.position.lerp(tempCameraPosition, journeyActive ? 0.06 : 0.045);
        camera.lookAt(currentTarget);

        nebula.rotation.y = time * 0.0035 * motion;
        stars.rotation.y = time * 0.004 * motion;
        stars.rotation.x = Math.sin(time * 0.09) * 0.015;

        nebulaUniforms.uTime.value = time;
        accretionMat.uniforms.uTime.value = time;
        accretionDisk2.material.uniforms.uTime.value = time + 12;
        accretionDisk.rotation.z += 0.0003 * motion;
        accretionDisk2.rotation.z -= 0.0002 * motion;
        stars.material.uniforms.uTime.value = time;
        if (_deepField) _deepField.userData.deepFieldMat.uniforms.uTime.value = time;
        planetUniforms.uTime.value = time;
        atmosphere.material.uniforms.uTime.value = time;
        atmosphere.scale.setScalar(1 + Math.sin(time * 1.35) * 0.006 * motion);

        distantPlanets.forEach(dp => {
          dp.uniforms.uTime.value = time;
          dp.atmoUniforms.uTime.value = time;
          dp.mesh.rotation.y = time * dp.rotSpeed * motion;
          dp.mesh.rotation.z = Math.sin(time * 0.12) * 0.03;
          dp.mesh.position.y += Math.sin(time * 0.3 + dp.mesh.position.x) * 0.0003 * motion;
        });

        distantRelics.forEach(dr => {
          dr.group.rotation.y += dr.rotSpeed * motion;
          dr.group.position.y += Math.sin(time * 0.4 + dr.group.position.x * 0.1) * 0.0004 * motion;
        });

        planet.rotation.y = time * 0.075 * motion;
        planet.rotation.z = Math.sin(time * 0.16) * 0.05;
        planet.position.y = Math.sin(time * 0.72) * 0.035 * motion;

        machine.rotation.z = time * 0.018 * motion;
        machine.rotation.y = Math.sin(time * 0.25) * 0.08;
        machineRings.forEach((ring, index) => {
          ring.rotation.z += ring.userData.speed * 0.004 * motion;
          ring.material.emissiveIntensity = 1.15 + Math.sin(time * 1.55 + index) * 0.5;
        });
        updateMachineInstances(time * motion);
        irisPetals.forEach((petal, index) => {
          petal.rotation.z = (index / irisPetals.length) * Math.PI * 2 +
            Math.sin(time * 1.25 + index * 0.31) * 0.035 * motion;
        });

        key.rotation.y = -0.26 + Math.sin(time * 0.58) * 0.2 * motion;
        key.rotation.x = -0.12 + Math.sin(time * 0.41) * 0.05 * motion;
        key.position.y = 0.12 + Math.sin(time * 0.76) * 0.09 * motion;
        keyHalo.rotation.z = time * 0.44 * motion;
        goldMaterial.emissiveIntensity = 0.14 + (Math.sin(time * 1.8) * 0.5 + 0.5) * 0.12;

        diamond.rotation.y = 0.18 + time * 0.18 * motion;
        diamond.rotation.x = 0.08 + Math.sin(time * 0.55) * 0.12 * motion;
        diamond.position.y = 0.22 + Math.sin(time * 0.91) * 0.1 * motion;
        diamondWire.rotation.copy(diamond.rotation);
        diamondWire.position.copy(diamond.position);
        diamondMaterial.iridescence = 0.08 + (Math.sin(time * 0.7) * 0.5 + 0.5) * 0.12;

        keyDust.rotation.y = time * 0.07 * motion;
        diamondDust.rotation.y = -time * 0.08 * motion;
        keyDust.material.uniforms.uTime.value = time;
        diamondDust.material.uniforms.uTime.value = time;

        energyRing.rotation.z = 0.12 + time * 0.022 * motion;
        energyRing.position.y = Math.sin(time * 0.72) * 0.035 * motion;
        ringMaterial.uniforms.uTime.value = time;

        connections.forEach(({ material }) => {
          material.uniforms.uTime.value = time;
        });

        if (_magField) _magField.userData.magFieldMat.uniforms.uTime.value = time;
        if (_auroraObj) _auroraObj.userData.auroraMat.uniforms.uTime.value = time;
        if (_deepWeb) _deepWeb.userData.deepWebMat.uniforms.uTime.value = time;
        if (_emPulse) _emPulse.userData.emPulseMat.uniforms.uTime.value = time;

        const pulse = 0.9 + Math.sin(time * 1.48) * 0.11;
        redLight.intensity = 14 + pulse * 4;
        planetGlow.material.opacity = 0.16 + pulse * 0.055;
        keyGlow.material.opacity = 0.17 + Math.sin(time * 1.2) * 0.035;
        diamondGlow.material.opacity = 0.14 + Math.sin(time * 1.65) * 0.035;

        cinematicPass.uniforms.uTime.value = time;

        // --- MOTION BLUR (journey velocity) ---
        if (journeyActive) {
          var vel = tempCameraPosition.clone().sub(camera.position);
          var speed = vel.length();
          var screenVel = vel.project(camera);
          cinematicPass.uniforms.uMotionBlur.value = Math.min(1, speed * 2.5);
          cinematicPass.uniforms.uMotionDir.value.set(screenVel.x * 0.5, screenVel.y * 0.5);
        } else {
          cinematicPass.uniforms.uMotionBlur.value *= 0.9;
        }

        // --- GOD RAYS: project planet center to screen ---
        var planetScreen = new THREE.Vector3(0, 0, 0).project(camera);
        var godRayCx = (planetScreen.x + 1) * 0.5;
        var godRayCy = (planetScreen.y + 1) * 0.5;
        var camDist2 = camera.position.length();
        var godRayStr = Math.max(0, 1 - camDist2 / 40) * 1.2;
        cinematicPass.uniforms.uGodRayCenter.value.set(godRayCx, godRayCy);
        cinematicPass.uniforms.uGodRayIntensity.value = godRayStr;

        // --- HEAT DISTORTION: lensing near planet ---
        cinematicPass.uniforms.uHeatCenter.value.set(godRayCx, godRayCy);
        cinematicPass.uniforms.uHeatIntensity.value = Math.max(0, 1 - camDist2 / 20) * 0.8;

        // --- COLOR GRADING: zone-based ---
        var zoneZ = camera.position.z;
        if (zoneZ > 100) {
          cinematicPass.uniforms.uColorGrade.value.set(0.85, 0.75, 0.95);
        } else if (zoneZ > 30) {
          var f = (zoneZ - 30) / 70;
          cinematicPass.uniforms.uColorGrade.value.set(0.92 + f * 0.08, 0.85 + f * 0.05, 0.88 + f * 0.12);
        } else {
          cinematicPass.uniforms.uColorGrade.value.set(1.0, 0.95, 0.90);
        }

        // --- DYNAMIC FOG (dense close, thin far) ---
        var fogDist = camera.position.length();
        scene.fog.density = fogDist > 100 ? 0.001 : 0.003 + (1 - fogDist / 100) * 0.012;

        // --- COSMIC DUST update ---
        if (_dustObj) {
          _dustObj.userData.dustMat.uniforms.uTime.value = time;
          _dustObj.userData.dustMat.uniforms.uCamPos.value.copy(camera.position);
        }

        // --- TITLE COLOR ADAPTATION ---
        var camLen = camera.position.length();
        var bloomProx = Math.max(0, Math.min(1, 1 - camLen / 18));
        var heroEl = document.getElementById("hero-title");
        if (heroEl) {
          if (bloomProx > 0.6) {
            // Close to center: bright white/cyan to counter red bloom
            var f = (bloomProx - 0.6) / 0.4;
            var r = Math.round(255 - f * 180);
            var g = Math.round(0 + f * 245);
            var b = Math.round(60 + f * 195);
            heroEl.style.setProperty("--title-fg", "rgb("+r+","+g+","+Math.min(b,255)+")");
            heroEl.style.setProperty("--title-glow", "rgba("+r+","+g+","+Math.min(b,255)+",.45)");
            heroEl.style.setProperty("--title-stroke", "rgba(255,255,255,.7)");
          } else {
            // Far or medium: neon red (default)
            heroEl.style.setProperty("--title-fg", "#ff003c");
            heroEl.style.setProperty("--title-glow", "rgba(255,0,60,.55)");
            heroEl.style.setProperty("--title-stroke", "rgba(255,255,255,.42)");
          }
        }

        // --- SPATIAL AUDIO UPDATE ---
        updateSpatialAudio(camera.position);

        // Raycast limitado a ~20 Hz para evitar coste innecesario.
        if (!isMobile && nowMs - lastRaycast > 48) {
          lastRaycast = nowMs;
          raycaster.setFromCamera(mouse, camera);
          const hits = raycaster.intersectObjects(clickable, true);
          hoveredRoot = hits[0]?.object?.userData?.rootName || "";
          document.body.dataset.hover = hoveredRoot;
          canvas.style.cursor = hoveredRoot ? "pointer" : "default";
        }

        updateLabels();
        updateTelemetry(nowMs, time);
        composer.render();
      }

      renderer.setAnimationLoop(animate);
      setFocus("all");
      applyQuality();

      // Liberación básica al abandonar la página.
      addEventListener("pagehide", () => {
        renderer.setAnimationLoop(null);
        geometryDispose(scene);
        composer.dispose?.();
        renderer.dispose();
        environmentTarget.dispose();
        metalMicro.dispose();
      }, { once: true });

      function geometryDispose(root) {
        root.traverse((object) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose?.());
          else object.material?.dispose?.();
        });
      }

    } catch (error) {
      fail(error);
    }
