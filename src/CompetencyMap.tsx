import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DOMAINS } from "./engine";
import { createMapMotion, type MapMotion } from "./mapMotion";

interface Props {
  scores: number[] | null;
  selected: number;
  onSelect: (index: number) => void;
}

export default function CompetencyMap({ scores, selected, onSelect }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const select = useRef(onSelect);
  const motion = useRef<MapMotion | null>(null);
  const currentSelected = useRef(selected);
  currentSelected.current = selected;
  const [failure, setFailure] = useState(false);
  const [ready, setReady] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  select.current = onSelect;
  const scoreKey = scores?.join(",") ?? "empty";

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailure(true);
      return;
    }
    setFailure(false);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 5, -5, 0.1, 100);
    camera.position.set(9, 10, 12);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.prepend(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "map-canvas";
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.2, 0);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.8;
    controls.rotateSpeed = 0.6;
    controls.update();
    controls.saveState();

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sun = new THREE.DirectionalLight(0xfffbed, 2.1);
    sun.position.set(-4, 10, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
      near: 0.1,
      far: 30,
    });
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0001;
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xd4e9da, 1.2);
    fill.position.set(6, 4, -6);
    scene.add(fill);

    const mat = (color: string, roughness = 0.8) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    const addCylinder = (
      radius: number,
      height: number,
      y: number,
      material: THREE.Material,
      segments = 6,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, segments),
        material,
      );
      mesh.position.y = y;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    };
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.11 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.73;
    floor.receiveShadow = true;
    scene.add(floor);
    addCylinder(4.28, 0.16, -0.57, mat("#c6d2c0"));
    addCylinder(4.28, 0.28, -0.35, mat("#e4eadb"));
    addCylinder(3.98, 0.05, -0.185, mat("#eef0e4"));

    // The six spokes connect the displayed domains to one combined readiness index.
    const anchors: THREE.Vector3[] = [];
    const pickable: THREE.Mesh[] = [];
    const towers: THREE.Group[] = [];
    const tops: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      const x = Math.cos(angle) * 2.55;
      const z = Math.sin(angle) * 2.55;
      const tower = new THREE.Group();
      tower.position.set(x, 0, z);
      scene.add(tower);
      towers.push(tower);
      const score = scores?.[i] ?? 0;
      const height = 0.25 + (score / 100) * 1.65;
      const path = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, -0.12, 0),
          new THREE.Vector3(x, -0.12, z),
        ]),
        new THREE.LineDashedMaterial({
          color: "#90a58f",
          dashSize: 0.1,
          gapSize: 0.1,
        }),
      );
      path.computeLineDistances();
      scene.add(path);
      const base = addCylinder(1.08, 0.13, -0.065, mat("#cfdbc5"));
      base.position.x = x;
      base.position.z = z;
      const lower = addCylinder(
        0.91,
        height * 0.42,
        height * 0.21,
        mat("#b2c7a3"),
      );
      lower.position.x = x;
      lower.position.z = z;
      const middle = addCylinder(
        0.79,
        height * 0.4,
        height * 0.62,
        mat("#729776"),
      );
      middle.position.x = x;
      middle.position.z = z;
      const top = addCylinder(
        0.66,
        height * 0.38,
        height * 0.85,
        mat("#315d47"),
      );
      top.position.x = x;
      top.position.z = z;
      top.userData.domain = i;
      middle.userData.domain = i;
      lower.userData.domain = i;
      pickable.push(top, middle, lower);
      tops.push(top);
      const cap = addCylinder(0.47, 0.035, height * 1.05, mat("#e0e9d0"));
      cap.position.x = x;
      cap.position.z = z;
      anchors.push(new THREE.Vector3(0, height * 1.05 + 0.47, 0));
      const pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8),
        mat("#5e7c61"),
      );
      pin.position.set(x, height * 1.05 + 0.21, z);
      scene.add(pin);
      [base, lower, middle, top, cap, pin].forEach((mesh) =>
        tower.attach(mesh),
      );
    }
    const center = addCylinder(0.63, 0.35, 0.07, mat("#fcfcf5"), 64);
    const centerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.41, 0.025, 8, 64),
      mat("#57785a"),
    );
    centerRing.rotation.x = Math.PI / 2;
    centerRing.position.y = 0.26;
    scene.add(centerRing);
    center.castShadow = true;
    const selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(1.13, 1.17, 6),
      new THREE.MeshBasicMaterial({ color: "#537144", side: THREE.DoubleSide }),
    );
    selectionRing.rotation.x = -Math.PI / 2;
    scene.add(selectionRing);

    const render = () => {
      renderer.render(scene, camera);
      const placed: { x: number; y: number; w: number; h: number }[] = [];
      const projected = anchors
        .map((anchor, i) => {
          const point = towers[i].localToWorld(anchor.clone()).project(camera);
          return {
            i,
            x: (point.x * 0.5 + 0.5) * container.clientWidth,
            y: (-point.y * 0.5 + 0.5) * container.clientHeight,
          };
        })
        .sort((a, b) => a.y - b.y);
      projected.forEach(({ i, x, y }) => {
        const label = labels.current[i];
        if (label) {
          const w = label.offsetWidth,
            h = label.offsetHeight;
          x = THREE.MathUtils.clamp(
            x,
            w / 2 + 7,
            container.clientWidth - w / 2 - 7,
          );
          y = THREE.MathUtils.clamp(
            y,
            h / 2 + 7,
            container.clientHeight - h / 2 - 7,
          );
          for (let attempt = 0; attempt < 6; attempt++) {
            const collision = placed.find(
              (p) =>
                Math.abs(x - p.x) < (w + p.w) / 2 + 5 &&
                Math.abs(y - p.y) < (h + p.h) / 2 + 5,
            );
            if (!collision) break;
            y = collision.y + (h + collision.h) / 2 + 5;
          }
          placed.push({ x, y, w, h });
          label.style.left = `${x}px`;
          label.style.top = `${y}px`;
        }
      });
    };
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      const aspect = width / height;
      const vertical = Math.max(6.8, 10.6 / aspect);
      camera.left = (-vertical * aspect) / 2;
      camera.right = (vertical * aspect) / 2;
      camera.top = vertical / 2;
      camera.bottom = -vertical / 2;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    motion.current = createMapMotion({
      host: container,
      camera,
      controls,
      towers,
      tops,
      selectionRing,
      selected: currentSelected.current,
      render,
      onPause: () => setAutoRotate(false),
      onReducedMotion: setReducedMotion,
    });
    let down = { x: 0, y: 0 };
    const pointerdown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const pointerup = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hit = ray.intersectObjects(pickable)[0];
      if (hit) select.current(hit.object.userData.domain);
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      motion.current?.dispose();
      motion.current = null;
      setFailure(true);
    };
    renderer.domElement.addEventListener("pointerdown", pointerdown);
    renderer.domElement.addEventListener("pointerup", pointerup);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    resize();
    setReady(true);
    return () => {
      observer.disconnect();
      motion.current?.dispose();
      motion.current = null;
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", pointerdown);
      renderer.domElement.removeEventListener("pointerup", pointerup);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        if (mesh.material)
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((m) => m.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [scoreKey]);

  useEffect(() => {
    motion.current?.select(selected);
  }, [selected, scoreKey, ready]);

  return (
    <div className="map-wrapper">
      <div
        className={`map-stage ${failure ? "map-failed" : ""}`}
        ref={host}
        aria-label="Peta kompetensi tiga dimensi"
      >
        {!failure && !ready && (
          <p className="map-loading" role="status">
            Menyiapkan peta kompetensi…
          </p>
        )}
        {!failure &&
          DOMAINS.map((domain, i) => (
            <button
              key={domain.id}
              ref={(el) => {
                labels.current[i] = el;
              }}
              className={`map-label ${selected === i ? "selected" : ""}`}
              onClick={() => onSelect(i)}
              aria-pressed={selected === i}
              aria-label={`Pilih ${domain.short}`}
            >
              <span>{domain.code}</span>
              {domain.short}
            </button>
          ))}
        {failure && (
          <div className="map-fallback">
            <h3>Peta 3D tidak tersedia</h3>
            <p>
              Browser ini tidak dapat menampilkan WebGL. Kamu tetap bisa
              menjelajahi semua kompetensi melalui daftar berikut.
            </p>
            {DOMAINS.map((d, i) => (
              <button
                key={d.id}
                onClick={() => onSelect(i)}
                aria-pressed={selected === i}
              >
                {d.short}
                <strong>
                  {scores ? Math.round(scores[i]) : "Belum dinilai"}
                </strong>
              </button>
            ))}
          </div>
        )}
      </div>
      {!failure && (
        <>
          <div className="map-toolbar">
            <span>Seret untuk memutar · pilih bidang untuk detail</span>
            <div>
              <button
                aria-label="Perkecil peta"
                onClick={() => motion.current?.zoom(1 / 1.15)}
              >
                −
              </button>
              <button
                aria-label="Perbesar peta"
                onClick={() => motion.current?.zoom(1.15)}
              >
                +
              </button>
              <button
                className="reset-camera"
                onClick={() => {
                  motion.current?.reset();
                }}
              >
                Atur ulang
              </button>
            </div>
          </div>
          <div className="motion-toolbar">
            <span>
              {reducedMotion
                ? "Gerakan dikurangi sesuai pengaturan perangkat."
                : "Lihat petamu dari berbagai sudut."}
            </span>
            <div>
              <button
                disabled={reducedMotion}
                onClick={() => motion.current?.replay()}
              >
                Ulang animasi
              </button>
              <button
                className={autoRotate ? "is-playing" : ""}
                disabled={reducedMotion}
                aria-pressed={autoRotate}
                onClick={() => {
                  const next = !autoRotate;
                  setAutoRotate(next);
                  motion.current?.setAutoRotate(next);
                }}
              >
                <span aria-hidden="true">{autoRotate ? "Ⅱ" : "▷"}</span>
                {autoRotate ? "Jeda putaran" : "Putar otomatis"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
