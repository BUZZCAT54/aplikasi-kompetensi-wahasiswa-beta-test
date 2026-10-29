import * as THREE from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface Options {
  host: HTMLElement;
  camera: THREE.OrthographicCamera;
  controls: OrbitControls;
  towers: THREE.Group[];
  tops: THREE.Mesh[];
  selectionRing: THREE.Mesh;
  selected: number;
  render: () => void;
  onPause: () => void;
  onReducedMotion: (reduced: boolean) => void;
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const duration = 1100;

export function createMapMotion(options: Options) {
  const { host, camera, controls, towers, tops, selectionRing, render } =
    options;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const home = camera.position.clone();
  const target = controls.target.clone();
  const light = new THREE.Color("#497457");
  const dark = new THREE.Color("#214631");
  let reduced = preference.matches;
  let frame: number | null = null;
  let disposed = false;
  let visible = true;
  let dragging = false;
  let auto = false;
  let lastTime = performance.now();
  let introStart: number | null = reduced ? null : lastTime;
  let focusStart: number | null = null;
  let selected = options.selected;
  let focusFrom = towers.map(() => 0);
  let focusValues: number[] = towers.map((_, i) => (i === selected ? 1 : 0));
  let cameraTween: {
    start: number;
    position: THREE.Vector3;
    target: THREE.Vector3;
    zoom: number;
    endPosition: THREE.Vector3;
    endZoom: number;
  } | null = null;
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.13;
  controls.autoRotateSpeed = 0.7;

  function stopFrame() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }

  function requestFrame() {
    if (disposed || document.hidden || !visible || frame !== null) return;
    frame = requestAnimationFrame(tick);
  }

  function pose(now: number) {
    let moving = false;
    if (focusStart !== null) {
      const progress = Math.min(1, (now - focusStart) / 550);
      focusValues = focusFrom.map((from, i) =>
        THREE.MathUtils.lerp(from, i === selected ? 1 : 0, ease(progress)),
      );
      if (progress === 1) focusStart = null;
      else moving = true;
    }
    towers.forEach((tower, i) => {
      const progress =
        introStart === null
          ? 1
          : THREE.MathUtils.clamp((now - introStart - i * 85) / duration, 0, 1);
      tower.scale.y = THREE.MathUtils.lerp(0.025, 1, ease(progress));
      tower.scale.x = tower.scale.z = 1 + focusValues[i] * 0.035;
      const material = tops[i].material as THREE.MeshStandardMaterial;
      material.color.copy(light).lerp(dark, focusValues[i]);
      if (progress < 1) moving = true;
    });
    if (introStart !== null) {
      const progress = Math.min(1, (now - introStart) / (duration + 425));
      if (!dragging && !cameraTween) {
        const offset = home.clone().sub(target);
        offset.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          (1 - ease(progress)) * 0.34,
        );
        camera.position.copy(target).add(offset);
      }
      if (progress === 1) introStart = null;
    }
    const tower = towers[selected];
    selectionRing.position.set(tower.position.x, -0.11, tower.position.z);
    const focusProgress =
      focusStart === null ? 1 : Math.min(1, (now - focusStart) / 550);
    selectionRing.scale.setScalar(1 + Math.sin(focusProgress * Math.PI) * 0.12);
    if (cameraTween) {
      const progress = Math.min(1, (now - cameraTween.start) / 650);
      camera.position.lerpVectors(
        cameraTween.position,
        cameraTween.endPosition,
        ease(progress),
      );
      controls.target.lerpVectors(cameraTween.target, target, ease(progress));
      camera.zoom = THREE.MathUtils.lerp(
        cameraTween.zoom,
        cameraTween.endZoom,
        ease(progress),
      );
      camera.updateProjectionMatrix();
      if (progress === 1) cameraTween = null;
      else moving = true;
    }
    return moving;
  }

  function tick(now: number) {
    frame = null;
    if (disposed || document.hidden || !visible) return;
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    const moving = pose(now);
    controls.autoRotate =
      auto && !reduced && introStart === null && cameraTween === null;
    const cameraChanged = controls.update(delta);
    render();
    if (moving || cameraChanged || dragging || auto) requestFrame();
  }

  function pause() {
    auto = false;
    controls.autoRotate = false;
    settleDamping();
    options.onPause();
  }

  function settleDamping() {
    const position = camera.position.clone();
    const lookAt = controls.target.clone();
    controls.autoRotate = false;
    controls.enableDamping = false;
    controls.update(0);
    camera.position.copy(position);
    controls.target.copy(lookAt);
    controls.update(0);
    controls.enableDamping = !reduced;
  }

  function beginDrag() {
    dragging = true;
    cameraTween = null;
    introStart = null;
    pause();
    requestFrame();
  }
  function endDrag() {
    dragging = false;
    requestFrame();
  }
  function visibilityChanged() {
    if (document.hidden) stopFrame();
    else {
      lastTime = performance.now();
      requestFrame();
    }
  }
  function preferenceChanged() {
    reduced = preference.matches;
    controls.enableDamping = !reduced;
    if (reduced) {
      introStart = null;
      focusStart = null;
      cameraTween = null;
      focusValues = towers.map((_, i) => (i === selected ? 1 : 0));
      pause();
    }
    options.onReducedMotion(reduced);
    requestFrame();
  }
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) {
      lastTime = performance.now();
      requestFrame();
    } else stopFrame();
  });
  observer.observe(host);
  controls.addEventListener("start", beginDrag);
  controls.addEventListener("end", endDrag);
  controls.addEventListener("change", requestFrame);
  document.addEventListener("visibilitychange", visibilityChanged);
  preference.addEventListener("change", preferenceChanged);
  options.onReducedMotion(reduced);
  pause();
  pose(lastTime);
  render();
  requestFrame();

  return {
    select(index: number) {
      if (index !== selected) pause();
      selected = index;
      focusFrom = [...focusValues];
      focusStart = reduced ? null : performance.now();
      if (reduced) focusValues = towers.map((_, i) => (i === selected ? 1 : 0));
      requestFrame();
    },
    zoom(factor: number) {
      introStart = null;
      const endZoom = THREE.MathUtils.clamp(
        (cameraTween?.endZoom ?? camera.zoom) * factor,
        0.75,
        1.45,
      );
      if (reduced) {
        camera.zoom = endZoom;
        camera.updateProjectionMatrix();
      } else
        cameraTween = {
          start: performance.now(),
          position: camera.position.clone(),
          target: controls.target.clone(),
          zoom: camera.zoom,
          endPosition: camera.position.clone(),
          endZoom,
        };
      requestFrame();
    },
    reset() {
      pause();
      introStart = null;
      settleDamping();
      if (reduced) {
        camera.position.copy(home);
        controls.target.copy(target);
        camera.zoom = 1;
        camera.updateProjectionMatrix();
      } else
        cameraTween = {
          start: performance.now(),
          position: camera.position.clone(),
          target: controls.target.clone(),
          zoom: camera.zoom,
          endPosition: home.clone(),
          endZoom: 1,
        };
      requestFrame();
    },
    replay() {
      if (reduced) return;
      pause();
      settleDamping();
      cameraTween = null;
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      controls.target.copy(target);
      introStart = performance.now();
      requestFrame();
    },
    setAutoRotate(value: boolean) {
      auto = value && !reduced;
      controls.autoRotate = auto;
      if (!auto) pause();
      lastTime = performance.now();
      requestFrame();
    },
    dispose() {
      disposed = true;
      stopFrame();
      observer.disconnect();
      controls.removeEventListener("start", beginDrag);
      controls.removeEventListener("end", endDrag);
      controls.removeEventListener("change", requestFrame);
      document.removeEventListener("visibilitychange", visibilityChanged);
      preference.removeEventListener("change", preferenceChanged);
    },
  };
}

export type MapMotion = ReturnType<typeof createMapMotion>;
