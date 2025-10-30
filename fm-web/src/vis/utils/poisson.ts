import * as THREE from 'three';

export function poissonRing({
  n = 7,
  inner = 2.2,          // 最近距离相机的半径
  outer = 5.5,          // 最远
  minDist = 1.0,        // 水母之间最小间距
  jitter = 0.35,
  seed = 1,
}: Partial<{
  n: number;
  inner: number;
  outer: number;
  minDist: number;
  jitter: number;
  seed: number;
}> = {}) {
  const rnd = (() => { 
    let s = seed; 
    return () => (s = (9301 * s + 49297) % 233280) / 233280; 
  })();
  
  const pts: THREE.Vector3[] = [];
  const tries = 1200;

  while (pts.length < n && pts.length < tries) {
    const r = THREE.MathUtils.lerp(inner, outer, rnd());
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r + (rnd() - 0.5) * jitter;
    const z = Math.sin(a) * r + (rnd() - 0.5) * jitter;
    const y = (rnd() - 0.5) * 0.6; // 高度变化
    const p = new THREE.Vector3(x, y, z);

    if (pts.every(q => p.distanceTo(q) > minDist)) pts.push(p);
  }
  
  // 轻微 Lloyd 放松，进一步均匀
  for (let k = 0; k < 2; k++) {
    pts.forEach((p, i) => {
      const neighbors = pts.filter((_, j) => j !== i && p.distanceTo(pts[j]) < minDist * 1.8);
      if (!neighbors.length) return;
      const avg = neighbors.reduce((a, b) => a.add(b.clone()), new THREE.Vector3()).divideScalar(neighbors.length);
      p.add(p.clone().sub(avg).multiplyScalar(0.25));
    });
  }
  
  return pts;
}

