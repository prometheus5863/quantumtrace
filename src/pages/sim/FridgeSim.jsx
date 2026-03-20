// src/pages/sim/FridgeSim.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

const STAGES = [
  { name: 'Still Plate',   y: 2.4,  radius: 3.0,  temp: '4K',    color: '#ffd700' },
  { name: 'Cold Plate',    y: 1.0,  radius: 2.4,  temp: '800mK', color: '#ffcc00' },
  { name: '100mK Plate',   y: -0.2, radius: 1.85, temp: '100mK', color: '#ffb700' },
  { name: 'Still Plate 2', y: -1.3, radius: 1.35, temp: '50mK',  color: '#ffa500' },
  { name: 'MXC Plate',     y: -2.3, radius: 0.9,  temp: '15mK',  color: '#ff8c00' },
];

function StagePlate({ stage, stageIndex, coolingProgress, totalStages }) {
  const frostRef = useRef();
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(stage.color), metalness: 1.0, roughness: 0.12, envMapIntensity: 4.0,
  }), [stage.color]);
  
  const frostMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#aaddff', emissive: '#00aaff', emissiveIntensity: 0, transparent: true, opacity: 0,
  }), []);

  useFrame(() => {
    if (!frostRef.current) return;
    const threshold = stageIndex / (totalStages - 1);
    const stageWidth = 1 / totalStages;
    if (coolingProgress > threshold) {
      const localProgress = (coolingProgress - threshold) / stageWidth;
      frostRef.current.material.opacity = Math.min(localProgress * 2, 0.8);
      frostRef.current.material.emissiveIntensity = Math.min(localProgress * 3, 2.5);
    } else {
      frostRef.current.material.opacity = 0;
      frostRef.current.material.emissiveIntensity = 0;
    }
  });

  return (
    <group position={[0, stage.y, 0]}>
      <mesh material={goldMaterial}>
        <cylinderGeometry args={[stage.radius, stage.radius, 0.055, 64]} />
      </mesh>
      <mesh ref={frostRef} position={[0, 0.028, 0]} material={frostMaterial}>
        <cylinderGeometry args={[stage.radius, stage.radius, 0.001, 64]} />
      </mesh>
    </group>
  );
}

function ConnectingRods({ upperStage, lowerStage, rodMaterial }) {
  const rods = useMemo(() => {
    const elements = [];
    const height = upperStage.y - lowerStage.y;
    for (let j = 0; j < 6; j++) {
      const angle = (j / 6) * Math.PI * 2;
      const rodRadius = lowerStage.radius * 0.85;
      const x = Math.cos(angle) * rodRadius;
      const z = Math.sin(angle) * rodRadius;
      const midY = (upperStage.y + lowerStage.y) / 2;
      elements.push(
        <mesh key={j} position={[x, midY, z]} material={rodMaterial}>
          <cylinderGeometry args={[0.022, 0.022, height, 8]} />
        </mesh>
      );
    }
    return elements;
  }, [upperStage, lowerStage, rodMaterial]);
  return <group>{rods}</group>;
}

function CryogenicPipes({ pipeMaterial }) {
  const pipes = useMemo(() => {
    const elements = [];
    const height = STAGES[0].y - STAGES[4].y + 0.5;
    const midY = (STAGES[0].y + STAGES[4].y) / 2;
    for (let j = 0; j < 4; j++) {
      const angle = (j / 4) * Math.PI * 2;
      elements.push(
        <mesh key={j} position={[Math.cos(angle) * 2.7, midY, Math.sin(angle) * 2.7]} material={pipeMaterial}>
          <cylinderGeometry args={[0.035, 0.035, height, 8]} />
        </mesh>
      );
    }
    return elements;
  }, [pipeMaterial]);
  return <group>{pipes}</group>;
}

function FridgeScene({ coolingActive, coolingProgress }) {
  const chandelierRef = useRef();
  const sweepLightRef = useRef();
  const coolingProgressRef = useRef(0);
  
  useEffect(() => { coolingProgressRef.current = coolingProgress; }, [coolingProgress]);
  
  const rodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffd700', metalness: 1.0, roughness: 0.25, envMapIntensity: 3.0,
  }), []);
  
  const pipeMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffd700', metalness: 1.0, roughness: 0.35, envMapIntensity: 2.5,
  }), []);

  useFrame((state, delta) => {
    if (chandelierRef.current) chandelierRef.current.rotation.y += delta * 0.07;
    if (sweepLightRef.current) {
      if (coolingActive) {
        const lightY = THREE.MathUtils.lerp(STAGES[0].y + 0.5, STAGES[4].y - 0.5, coolingProgressRef.current);
        sweepLightRef.current.position.y = lightY;
        sweepLightRef.current.color.set('#00ccff');
        sweepLightRef.current.intensity = 3.0;
      } else {
        sweepLightRef.current.intensity = 0;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.04} />
      <spotLight position={[0, 6, 0]} angle={0.35} penumbra={0.7} intensity={4} color="#ffffff" castShadow />
      <pointLight position={[0, -2.8, 0]} color="#00aaff" intensity={2.5} distance={5} />
      <pointLight position={[3, 1, 3]} color="#ff6600" intensity={0.4} distance={8} />
      <pointLight ref={sweepLightRef} position={[0, 3, 0]} intensity={0} distance={4} />
      <Environment preset="warehouse" />
      
      {/* Outer shield */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[3.6, 3.6, 6.0, 64, 1, true]} />
        <meshStandardMaterial color="#c0c0c8" metalness={0.88} roughness={0.12} side={THREE.BackSide} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 3.1, 0]}>
        <cylinderGeometry args={[3.6, 3.6, 0.08, 64]} />
        <meshStandardMaterial color="#111116" metalness={0.5} roughness={0.8} />
      </mesh>

      {/* Main chandelier group */}
      <group ref={chandelierRef}>
        {STAGES.map((stage, i) => (
          <StagePlate key={i} stage={stage} stageIndex={i}
            coolingProgress={coolingProgress} totalStages={STAGES.length} />
        ))}
        {STAGES.slice(0, -1).map((stage, i) => (
          <ConnectingRods key={i} upperStage={stage} lowerStage={STAGES[i + 1]} rodMaterial={rodMaterial} />
        ))}
        <CryogenicPipes pipeMaterial={pipeMaterial} />
      </group>

      {/* Processor at bottom */}
      <mesh position={[0, -2.6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.035, 48]} />
        <meshStandardMaterial color="#001a30" metalness={0.3} roughness={0.6} />
      </mesh>
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.45, -2.58, Math.sin(angle) * 0.45]}>
            <sphereGeometry args={[0.025, 16, 16]} />
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={5} />
          </mesh>
        );
      })}

      <OrbitControls enablePan={false} minDistance={4} maxDistance={14}
        minPolarAngle={Math.PI * 0.1} maxPolarAngle={Math.PI * 0.85} />
    </>
  );
}

function ControlPanel({ coolingActive, onActivateCooling, coolingProgress }) {
  const getStageProgress = (index) => {
    const threshold = index / (STAGES.length - 1);
    const stageWidth = 1 / STAGES.length;
    if (coolingProgress > threshold) return Math.min((coolingProgress - threshold) / stageWidth, 1);
    return 0;
  };
  
  return (
    <>
      <style>{`
        @keyframes fridgePulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
      <div style={{ position:'fixed', bottom:32, left:32, padding:'22px 26px',
        background:'rgba(0,5,20,0.85)', backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)', borderRadius:12,
        border:'1px solid rgba(0,212,255,0.15)', fontFamily:'monospace', zIndex:100, minWidth:280 }}>
        <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#00d4ff', fontWeight:600,
          textTransform:'uppercase', marginBottom:4 }}>DILUTION REFRIGERATOR</div>
        <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(0,212,255,0.6)',
          marginBottom:16, textTransform:'uppercase' }}>OXFORD INSTRUMENTS KF-3000</div>
        
        <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:12, marginBottom:16 }}>
          <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(255,255,255,0.5)',
            marginBottom:10, textTransform:'uppercase' }}>Temperature Cascade</div>
          {STAGES.map((stage, index) => {
            const sp = getStageProgress(index);
            return (
              <div key={stage.name} style={{ display:'flex', alignItems:'center',
                justifyContent:'space-between', marginBottom:8, fontSize:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                  <span style={{ color:'rgba(255,255,255,0.7)', minWidth:90, fontSize:9,
                    letterSpacing:'0.05em' }}>{stage.name.toUpperCase()}</span>
                  <div style={{ flex:1, height:6, background:'rgba(0,212,255,0.1)',
                    borderRadius:3, overflow:'hidden', maxWidth:80 }}>
                    <div style={{ width:`${sp * 100}%`, height:'100%',
                      background:'linear-gradient(90deg,#00aaff,#00d4ff)',
                      borderRadius:3, transition:'width 0.1s ease-out' }} />
                  </div>
                </div>
                <span style={{ color:'#00d4ff', fontFamily:'monospace', fontSize:10,
                  minWidth:45, textAlign:'right' }}>{stage.temp}</span>
              </div>
            );
          })}
        </div>

        <button onClick={onActivateCooling} disabled={coolingActive} style={{
          width:'100%', padding:'12px 0', marginTop:8,
          background: coolingActive ? 'rgba(0,180,255,0.08)'
            : coolingProgress >= 1 ? 'rgba(0,255,136,0.12)' : 'rgba(0,212,255,0.12)',
          border:`1px solid ${coolingProgress >= 1 ? 'rgba(0,255,136,0.5)' : 'rgba(0,212,255,0.5)'}`,
          borderRadius:6, color: coolingProgress >= 1 ? '#00ff88' : '#00d4ff',
          fontSize:11, letterSpacing:'0.1em', cursor: coolingActive ? 'not-allowed' : 'pointer',
          fontFamily:'monospace', textTransform:'uppercase', fontWeight:500,
          animation: coolingActive ? 'fridgePulse 1s ease-in-out infinite' : 'none' }}>
          {coolingProgress >= 1 && !coolingActive ? 'SEQUENCE COMPLETE — 15 mK'
            : coolingActive ? 'COOLING IN PROGRESS...' : 'INITIALIZE COOLING'}
        </button>

        <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['HELIUM-3 FLOW','NOMINAL'],['MIXING CHAMBER','ISOLATED'],['VIBRATION ISO','ACTIVE']].map(([label,val],i)=>(
            <div key={i} style={{ background:'rgba(0,0,0,0.2)', padding:'8px 10px',
              borderRadius:4, gridColumn: i===2 ? 'span 2' : undefined }}>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:10, color:'#00ff88', letterSpacing:'0.05em' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function FridgeSim() {
  const [coolingActive, setCoolingActive] = useState(false);
  const [coolingProgress, setCoolingProgress] = useState(0);
  
  useEffect(() => {
    if (!coolingActive) return;
    const start = window.performance.now();
    const DURATION = 4000;
    const tick = () => {
      const p = Math.min((window.performance.now() - start) / DURATION, 1);
      setCoolingProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setCoolingActive(false);
    };
    requestAnimationFrame(tick);
  }, [coolingActive]);

  const handleActivateCooling = useCallback(() => {
    if (!coolingActive) { setCoolingProgress(0); setCoolingActive(true); }
  }, [coolingActive]);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => window.history.back()} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <Canvas camera={{ position:[0, 2, 8], fov:50 }}
        gl={{ antialias:true, clearColor:'#000', alpha:false }}
        frameloop="always">
        <FridgeScene coolingActive={coolingActive} coolingProgress={coolingProgress} />
      </Canvas>
      
      <ControlPanel coolingActive={coolingActive} onActivateCooling={handleActivateCooling}
        coolingProgress={coolingProgress} />
    </div>
  );
}
