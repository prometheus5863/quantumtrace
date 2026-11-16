// src/pages/sim/GatesSim.jsx
import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import StudioEnv from '../../components/StudioEnv';
import { GATES, KET0, applyGate, describe } from '../../lib/bloch';

function BlochSphere({ stateVector }) {
  const vectorRef = useRef();
  const trailRef = useRef();
  const trailPoints = useRef([]);
  const MAX_TRAIL_POINTS = 100;

  const targetVector = useMemo(() => {
    const v = new THREE.Vector3(
      Math.sin(stateVector.theta) * Math.cos(stateVector.phi),
      Math.cos(stateVector.theta),
      Math.sin(stateVector.theta) * Math.sin(stateVector.phi)
    );
    return v.multiplyScalar(3);
  }, [stateVector]);

  useFrame(() => {
    if (vectorRef.current) {
      vectorRef.current.position.lerp(targetVector, 0.1);
      const direction = vectorRef.current.position.clone().normalize();
      vectorRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      
      // Update trail
      trailPoints.current.push(vectorRef.current.position.clone());
      if (trailPoints.current.length > MAX_TRAIL_POINTS) trailPoints.current.shift();
      
      if (trailRef.current) {
        trailRef.current.geometry.setFromPoints(trailPoints.current);
      }
    }
  });

  return (
    <group>
      {/* Sphere Shell */}
      <Sphere args={[3, 64, 64]}>
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.05} wireframe />
      </Sphere>
      
      {/* Axes */}
      <gridHelper args={[6, 12, '#00d4ff', '#003366']} rotation={[Math.PI / 2, 0, 0]} />
      <gridHelper args={[6, 12, '#00d4ff', '#003366']} />
      
      {/* State Vector */}
      <group ref={vectorRef}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 3, 8]} position={[0, 1.5, 0]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Trail */}
      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#00ff88" transparent opacity={0.5} linewidth={2} />
      </line>

      {/* Labels */}
      <Html position={[0, 3.5, 0]} center style={{ color:'#ffffff', fontFamily:'monospace', fontSize:15, pointerEvents:'none', whiteSpace:'nowrap' }}>|0⟩</Html>
      <Html position={[0, -3.5, 0]} center style={{ color:'#ffffff', fontFamily:'monospace', fontSize:15, pointerEvents:'none', whiteSpace:'nowrap' }}>|1⟩</Html>
      <Html position={[3.5, 0, 0]} center style={{ color:'#ffffff', fontFamily:'monospace', fontSize:15, pointerEvents:'none', whiteSpace:'nowrap' }}>|+⟩</Html>
      <Html position={[-3.5, 0, 0]} center style={{ color:'#ffffff', fontFamily:'monospace', fontSize:15, pointerEvents:'none', whiteSpace:'nowrap' }}>|-⟩</Html>
    </group>
  );
}

function TransmonQubits() {
  const qubits = useMemo(() => {
    const q = [];
    for (let i = 0; i < 3; i++) {
      q.push(
        <group key={i} position={[i * 3 - 3, -5, 0]}>
          <mesh>
            <boxGeometry args={[1.5, 0.1, 1.5]} />
            <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2} />
          </mesh>
          {/* Coaxial cables */}
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 5, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />
          </mesh>
        </group>
      );
    }
    return q;
  }, []);
  return <group>{qubits}</group>;
}

function GatesScene({ stateVector }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      <StudioEnv look="night" />
      
      <BlochSphere stateVector={stateVector} />
      <TransmonQubits />
      
      <OrbitControls enablePan={false} minDistance={5} maxDistance={15} />
    </>
  );
}

function ControlPanel({ stateVector, bloch, history, onApplyGate }) {
  return (
    <div style={{ position:'fixed', bottom:32, left:32, padding:'22px 26px',
      background:'rgba(0,5,20,0.85)', backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)', borderRadius:12,
      border:'1px solid rgba(0,212,255,0.15)', fontFamily:'monospace', zIndex:100, minWidth:320 }}>
      <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#00d4ff', fontWeight:600,
        textTransform:'uppercase', marginBottom:4 }}>QUANTUM GATE SIMULATOR</div>
      <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(0,212,255,0.6)',
        marginBottom:16, textTransform:'uppercase' }}>SINGLE QUBIT OPERATIONS</div>
      
      <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:12, marginBottom:16 }}>
        <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(255,255,255,0.5)',
          marginBottom:10, textTransform:'uppercase' }}>Current State</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>THETA (θ)</span>
          <span style={{ fontSize:10, color:'#00d4ff' }}>{stateVector.theta.toFixed(4)} rad</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>PHI (φ)</span>
          <span style={{ fontSize:10, color:'#00d4ff' }}>{stateVector.phi.toFixed(4)} rad</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>BLOCH VECTOR (x, y, z)</span>
          <span style={{ fontSize:10, color:'#00ff88' }}>({bloch.map((c) => c.toFixed(2)).join(', ')})</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>P(|0⟩) / P(|1⟩)</span>
          <span style={{ fontSize:10, color:'#00d4ff' }}>{(stateVector.p0 * 100).toFixed(1)}% / {(stateVector.p1 * 100).toFixed(1)}%</span>
        </div>
        <div style={{ height:4, background:'rgba(255,0,170,0.5)', borderRadius:2 }}>
          <div style={{ width:`${stateVector.p0 * 100}%`, height:'100%', background:'#00d4ff', borderRadius:2, transition:'width 0.3s ease' }} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {Object.entries(GATES).map(([gate, g]) => ({ name: `${g.label} gate`, gate, desc: g.desc })).map((g) => (
          <button key={g.gate} onClick={() => onApplyGate(g.gate)} style={{
            padding:'12px 8px', background:'rgba(0,212,255,0.12)',
            border:'1px solid rgba(0,212,255,0.4)', borderRadius:6,
            color:'#00d4ff', fontSize:11, letterSpacing:'0.1em',
            cursor:'pointer', fontFamily:'monospace', textAlign:'left' }}>
            <div style={{ fontWeight:700, marginBottom:2 }}>{g.name}</div>
            <div style={{ fontSize:8, opacity:0.6 }}>{g.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ flex:1, fontSize:10, color:'rgba(255,255,255,0.5)', letterSpacing:'0.08em', minHeight:14 }}>
          {history.length ? `|0⟩ → ${history.join(' → ')}` : 'Start: |0⟩. Try H, then S, then H.'}
        </div>
        <button onClick={() => onApplyGate('RESET')} style={{ padding:'6px 10px', background:'transparent',
          border:'1px solid rgba(255,255,255,0.25)', borderRadius:4, color:'rgba(255,255,255,0.7)',
          fontSize:9, letterSpacing:'0.1em', cursor:'pointer', fontFamily:'monospace' }}>RESET</button>
      </div>
    </div>
  );
}

export default function GatesSim() {
  // The state is the Bloch vector itself; every gate is an exact rotation of it (see lib/bloch.js).
  const [bloch, setBloch] = useState(KET0);
  const [history, setHistory] = useState([]);
  const stateVector = useMemo(() => describe(bloch), [bloch]);

  const handleApplyGate = useCallback((gate) => {
    if (gate === 'RESET') { setBloch(KET0); setHistory([]); return; }
    setBloch((v) => applyGate(gate, v));
    setHistory((h) => [...h, gate].slice(-12));
  }, []);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => { window.location.hash = '#/'; }} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <Canvas camera={{ position:[0, 0, 10], fov:45 }}
        gl={{ clearColor:'#00020a', alpha:false }}
        frameloop="always">
        <GatesScene stateVector={stateVector} />
      </Canvas>
      
      <ControlPanel stateVector={stateVector} bloch={bloch} history={history} onApplyGate={handleApplyGate} />
    </div>
  );
}
