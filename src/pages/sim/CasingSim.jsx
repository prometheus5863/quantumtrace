// src/pages/sim/CasingSim.jsx
import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Environment, OrbitControls, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function CasingScene({ thermalShielding, powerState }) {
  const shieldingRef = useRef(thermalShielding);
  const powerStateRef = useRef(powerState);
  useEffect(() => { shieldingRef.current = thermalShielding; }, [thermalShielding]);
  useEffect(() => { powerStateRef.current = powerState; }, [powerState]);
  
  const groupRef = useRef();
  const lightRef = useRef();
  const glowPlanesRef = useRef([]);
  const stripeRef = useRef();
  
  const currentLightColor = useRef(new THREE.Color('#002244'));
  const currentLightIntensity = useRef(0.5);
  const currentPlaneColor = useRef(new THREE.Color('#001133'));
  const currentStripeEmissive = useRef(0.2);
  
  const targetColdColor = useMemo(() => new THREE.Color('#00ffff'), []);
  const targetWarmColor = useMemo(() => new THREE.Color('#002244'), []);
  const targetPlaneCold = useMemo(() => new THREE.Color('#00eeff'), []);
  const targetPlaneWarm = useMemo(() => new THREE.Color('#001133'), []);
  
  const ventPositions = [-1.2, -0.7, -0.2, 0.3, 0.8, 1.3];
  const glowPlaneYPositions = [-0.5, 0.2, 0.9];

  useFrame((state, delta) => {
    const shielding = shieldingRef.current;
    const isActive = powerStateRef.current === 'active';
    const shieldingNorm = shielding / 100;
    
    if (groupRef.current && isActive) groupRef.current.rotation.y += delta * 0.12;
    
    if (lightRef.current) {
      const baseIntensity = 8.0 * (1 - shieldingNorm) + 0.5;
      const targetIntensity = baseIntensity * (isActive ? 1.5 : 1);
      currentLightIntensity.current = THREE.MathUtils.lerp(currentLightIntensity.current, targetIntensity, 0.05);
      lightRef.current.intensity = currentLightIntensity.current;
      
      const targetLightColor = new THREE.Color().lerpColors(targetColdColor, targetWarmColor, shieldingNorm);
      currentLightColor.current.lerp(targetLightColor, 0.05);
      lightRef.current.color.copy(currentLightColor.current);
    }
    
    glowPlanesRef.current.forEach((plane) => {
      if (plane && plane.material) {
        const targetColor = new THREE.Color().lerpColors(targetPlaneCold, targetPlaneWarm, shieldingNorm);
        currentPlaneColor.current.lerp(targetColor, 0.05);
        plane.material.color.copy(currentPlaneColor.current);
      }
    });
    
    if (stripeRef.current && stripeRef.current.material) {
      const targetEmissive = 4.0 * (1 - shieldingNorm) + 0.2;
      currentStripeEmissive.current = THREE.MathUtils.lerp(currentStripeEmissive.current, targetEmissive, 0.05);
      stripeRef.current.material.emissiveIntensity = currentStripeEmissive.current;
    }
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      <directionalLight position={[4, 6, 4]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-4, 2, -4]} intensity={0.6} color="#0044ff" />
      
      <group ref={groupRef}>
        <RoundedBox args={[3.2, 4.2, 3.2]} radius={0.15} smoothness={4} position={[0, 0, 0]}>
          <meshPhysicalMaterial color="#0d1117" metalness={0.92} roughness={0.08} envMapIntensity={2} />
        </RoundedBox>
        
        <RoundedBox args={[2.0, 2.4, 0.08]} radius={0.05} position={[0, 0.1, 1.62]}>
          <MeshTransmissionMaterial
            transmission={1} thickness={0.4}
            roughness={thermalShielding * 0.003}
            ior={1.5} chromaticAberration={0.04}
            backside={true} color="#a8d4ff"
          />
        </RoundedBox>
        
        {glowPlaneYPositions.map((y, index) => (
          <mesh key={index} ref={(el) => (glowPlanesRef.current[index] = el)} position={[0, y, 1.2]}>
            <planeGeometry args={[1.6, 0.02]} />
            <meshBasicMaterial color="#001133" side={THREE.DoubleSide} />
          </mesh>
        ))}
        
        <pointLight ref={lightRef} position={[0, 0, 0.8]} color="#002244" intensity={0.5} distance={4} />
        
        <mesh ref={stripeRef} position={[0, 0.8, 0]}>
          <boxGeometry args={[3.3, 0.025, 3.3]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.2} />
        </mesh>
        
        {ventPositions.map((y, index) => (
          <group key={index}>
            <mesh position={[-1.62, y, 0]}>
              <boxGeometry args={[0.04, 0.08, 1.6]} />
              <meshStandardMaterial color="#0a1520" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[1.62, y, 0]}>
              <boxGeometry args={[0.04, 0.08, 1.6]} />
              <meshStandardMaterial color="#0a1520" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
        ))}
        
        <mesh position={[0, -2.18, 0]}>
          <cylinderGeometry args={[2.0, 2.2, 0.1, 64]} />
          <meshStandardMaterial color="#0f1923" metalness={0.95} roughness={0.2} />
        </mesh>
      </group>
      
      <Environment preset="studio" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={12}
        autoRotate={powerState === 'standby'} autoRotateSpeed={0.4} />
    </>
  );
}

function ControlPanel({ thermalShielding, setThermalShielding, powerState, setPowerState }) {
  const displayTemp = (15 + thermalShielding * 2.8).toFixed(1);
  const tempColorNorm = thermalShielding / 100;
  const r = Math.round(0 + tempColorNorm * 255);
  const g = Math.round(255 - tempColorNorm * 153);
  const b = Math.round(255 - tempColorNorm * 255);
  const tempColor = `rgb(${r}, ${g}, ${b})`;
  const gradientPercent = thermalShielding;

  return (
    <>
      <style>{`
        .thermal-slider { width:100%; appearance:none; height:2px; background: linear-gradient(to right, #00d4ff ${gradientPercent}%, #1a2a3a ${gradientPercent}%); outline:none; cursor:pointer; }
        .thermal-slider::-webkit-slider-thumb { appearance:none; width:12px; height:12px; background:#00d4ff; border-radius:50%; cursor:pointer; box-shadow:0 0 8px rgba(0,212,255,0.6); }
        .thermal-slider::-moz-range-thumb { width:12px; height:12px; background:#00d4ff; border-radius:50%; cursor:pointer; border:none; box-shadow:0 0 8px rgba(0,212,255,0.6); }
      `}</style>
      <div style={{ position:'fixed', bottom:32, left:32, padding:'24px 28px',
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(16px)',
        WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(0,212,255,0.2)',
        borderRadius:12, color:'#e8eaf0', fontFamily:'monospace', zIndex:100, minWidth:260 }}>
        <div style={{ fontSize:10, letterSpacing:'0.15em', color:'#00d4ff', marginBottom:20, fontWeight:'bold' }}>
          THERMAL SHIELDING CONTROL
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontSize:11, color:'#8899aa' }}>SHIELDING INTEGRITY</span>
          <span style={{ fontSize:11, color:'#00d4ff' }}>{thermalShielding}%</span>
        </div>
        <input type="range" min={0} max={100} value={thermalShielding}
          onChange={(e) => setThermalShielding(Number(e.target.value))}
          className="thermal-slider" />
        <button onClick={() => setPowerState(powerState === 'standby' ? 'active' : 'standby')}
          style={{ marginTop:16, width:'100%', padding:'10px 0',
          background: powerState === 'active' ? 'rgba(0,212,255,0.15)' : 'transparent',
          border:'1px solid rgba(0,212,255,0.4)', color:'#00d4ff', fontSize:11,
          letterSpacing:'0.12em', cursor:'pointer', borderRadius:4 }}>
          SYSTEM: {powerState.toUpperCase()}
        </button>
        <div style={{ marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#8899aa' }}>TEMP</span>
          <span style={{ fontSize:12, color:tempColor, fontWeight:'bold' }}>{displayTemp} mK</span>
        </div>
      </div>
    </>
  );
}

export default function CasingSim() {
  const [thermalShielding, setThermalShielding] = useState(100);
  const [powerState, setPowerState] = useState('standby');
  
  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000010', position:'relative', overflow:'hidden' }}>
      <button onClick={() => window.history.back()} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <Canvas camera={{ position:[0, 1.5, 5], fov:45 }}
        gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping, alpha:true }}
        frameloop="always">
        <CasingScene thermalShielding={thermalShielding} powerState={powerState} />
      </Canvas>
      
      <ControlPanel thermalShielding={thermalShielding} setThermalShielding={setThermalShielding}
        powerState={powerState} setPowerState={setPowerState} />
    </div>
  );
}
