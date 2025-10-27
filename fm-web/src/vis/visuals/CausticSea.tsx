import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { VisualProps } from '../registry';

const frag = /* glsl */`
precision mediump float;
varying vec2 vUv;
uniform float u_time;
uniform vec3  u_bands;

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.2,289.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }

float caustics(vec2 p){
  float n = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  for(int i=0;i<4;i++){
    n += (noise(p*freq)-0.5) * amp;
    amp *= 0.6;
    freq *= 2.1;
  }
  return smoothstep(0.52, 1.0, 1.0 - abs(n));
}

void main(){
  vec2 uv = vUv * 6.0;
  float flow = u_time * (0.6 + u_bands.y*1.4);
  float c = caustics(uv + flow);

  vec3 sand = vec3(0.05,0.08,0.1);
  vec3 col = sand + vec3(c) * (0.3 + u_bands.y*0.9);

  float vign = smoothstep(1.3, 0.35, distance(vUv, vec2(0.5)));
  col *= mix(0.85, 1.1, vign + u_bands.x*0.2);
  gl_FragColor = vec4(col, 1.0);
}
`;

const vert = /* glsl */`
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

function CausticPlane({ audio }: VisualProps){
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(()=>({
    u_time: { value: 0 },
    u_bands: { value: new THREE.Vector3() }
  }),[]);

  useFrame((_, dt)=>{
    uniforms.u_time.value += dt;
    const [l,m,h] = audio.bands();
    uniforms.u_bands.value.set(l,m,h);
  });

  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0,-0.4,0]} scale={[4,4,4]}>
      <planeGeometry args={[1,1,1,1]} />
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </mesh>
  );
}

const CausticSeaVisual = ({ audio, params }: VisualProps) => {
  const quality = params?.quality === 'low' ? 'low' : 'high';
  return (
    <Canvas camera={{ position: [0.8, 0.9, 1.8], fov: 50 }} dpr={quality === 'low' ? [1,1] : [1,1.4]}>
      <color attach="background" args={['#020b14']} />
      <ambientLight intensity={0.25 + audio.rms()*0.6} />
      <directionalLight position={[1,1.5,1]} intensity={0.7 + audio.rms()*0.6} />
      <CausticPlane audio={audio} params={params} />
    </Canvas>
  );
};

export default CausticSeaVisual;
