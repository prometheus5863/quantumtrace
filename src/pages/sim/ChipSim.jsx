// src/pages/sim/ChipSim.jsx
import { useRef, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import StudioEnv from '../../components/StudioEnv';

import { buildHeavyHex } from '../../lib/heavyHex';

// IBM Eagle: 127 qubits, 144 couplers, heavy-hex. Bridge qubits (the ones joining two rows) are drawn in magenta.
const EAGLE = buildHeavyHex(0.9);

function Qubit({ qubit, selected, neighbour, pulseActive, onSelect }) {
  const meshRef = useRef();
  const baseColor = selected ? '#ffffff' : neighbour ? '#00ff88' : qubit.bridge ? '#ff00ff' : '#00ccff';
  const base = selected ? 6 : neighbour ? 5 : qubit.bridge ? 4 : 3;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const pulse = pulseActive ? Math.sin(time * 15 - (qubit.col + qubit.row) * 0.9) * 0.5 + 0.5 : 0;
    meshRef.current.material.emissiveIntensity = base + pulse * 4;
    meshRef.current.scale.setScalar((selected ? 1.5 : 1) + pulse * 0.15);
  });

  return (
    <mesh ref={meshRef} position={qubit.pos}
      onClick={(e) => { e.stopPropagation(); onSelect(qubit.id); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}>
      <octahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={base} metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function Coupler({ a, b, lit, pulseActive }) {
  const meshRef = useRef();
  const p = EAGLE.qubits[a].pos, q = EAGLE.qubits[b].pos;
  const along = p[0] !== q[0];
  const mid = [(p[0] + q[0]) / 2, 0, (p[2] + q[2]) / 2];

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const pulse = pulseActive ? Math.sin(time * 15 - (mid[0] + mid[2]) * 1.2) * 0.5 + 0.5 : 0;
    meshRef.current.material.emissiveIntensity = (lit ? 3 : 0.5) + pulse * 3;
    meshRef.current.material.opacity = (lit ? 0.9 : 0.3) + pulse * 0.5;
  });

  return (
    <mesh position={mid} ref={meshRef}>
      <boxGeometry args={along ? [0.9, 0.05, 0.05] : [0.05, 0.05, 0.9]} />
      <meshStandardMaterial color="#ffffff" emissive={lit ? '#00ff88' : '#00ccff'} emissiveIntensity={0.5} transparent opacity={0.3} />
    </mesh>
  );
}

function ChipScene({ pulseActive, selected, onSelect }) {
  const near = selected === null ? [] : EAGLE.neighbors[selected];
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ccff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      <StudioEnv look="night" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} onClick={() => onSelect(null)}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#000816" metalness={0.9} roughness={0.1} />
      </mesh>
      <gridHelper args={[25, 25, '#003366', '#001122']} position={[0, -0.38, 0]} />

      {EAGLE.qubits.map((q) => (
        <Qubit key={q.id} qubit={q} selected={q.id === selected} neighbour={near.includes(q.id)}
          pulseActive={pulseActive} onSelect={onSelect} />
      ))}
      {EAGLE.edges.map(([a, b]) => (
        <Coupler key={`${a}-${b}`} a={a} b={b} pulseActive={pulseActive}
          lit={selected !== null && (a === selected || b === selected)} />
      ))}

      <OrbitControls enablePan={false} minDistance={5} maxDistance={22}
        minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

const row = (label, value, color = '#00d4ff') => (
  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, gap:16 }}>
    <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>{label}</span>
    <span style={{ fontSize:10, color }}>{value}</span>
  </div>
);

function ControlPanel({ pulseActive, onPulse, selected }) {
  const q = selected === null ? null : EAGLE.qubits[selected];
  return (
    <div style={{ position:'fixed', bottom:32, left:32, padding:'22px 26px',
      background:'rgba(0,5,20,0.85)', backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)', borderRadius:12,
      border:'1px solid rgba(0,212,255,0.15)', fontFamily:'monospace', zIndex:100, width:320 }}>
      <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#00d4ff', fontWeight:600,
        textTransform:'uppercase', marginBottom:4 }}>HEAVY-HEX PROCESSOR</div>
      <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(0,212,255,0.6)',
        marginBottom:16, textTransform:'uppercase' }}>IBM EAGLE COUPLING MAP</div>

      <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'12px 12px 4px', marginBottom:12 }}>
        {row('QUBITS', EAGLE.qubits.length)}
        {row('COUPLERS', EAGLE.edges.length)}
        {row('NEIGHBOURS PER QUBIT', '1 to 3')}
      </div>

      <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'12px 12px 4px', marginBottom:16, minHeight:86 }}>
        {q ? (<>
          {row('SELECTED', `Q${q.id}`, '#ffffff')}
          {row('ROLE', q.bridge ? 'BRIDGE BETWEEN ROWS' : 'ROW QUBIT', q.bridge ? '#ff00ff' : '#00d4ff')}
          {row('COUPLED TO', EAGLE.neighbors[q.id].map((n) => `Q${n}`).join('  '), '#00ff88')}
        </>) : (
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)', lineHeight:1.6, paddingBottom:8 }}>
            Click a qubit to see what it is wired to. Low connectivity is the point of heavy-hex:
            fewer neighbours means fewer frequency collisions and less crosstalk.
          </div>
        )}
      </div>

      <button onClick={onPulse} disabled={pulseActive} style={{
        width:'100%', padding:'12px 0',
        background: pulseActive ? 'rgba(0,180,255,0.08)' : 'rgba(0,212,255,0.12)',
        border:`1px solid ${pulseActive ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.5)'}`,
        borderRadius:6, color:'#00d4ff', fontSize:11, letterSpacing:'0.1em',
        cursor: pulseActive ? 'not-allowed' : 'pointer', fontFamily:'monospace',
        textTransform:'uppercase', fontWeight:500 }}>
        {pulseActive ? 'PULSE TRAVELLING...' : 'SEND A PULSE ACROSS THE CHIP'}
      </button>
    </div>
  );
}

export default function ChipSim() {
  const [pulseActive, setPulseActive] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const handlePulse = useCallback(() => {
    if (pulseActive) return;
    setPulseActive(true);
    window.setTimeout(() => setPulseActive(false), 2000);
  }, [pulseActive]);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => { window.location.hash = '#/'; }} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <Canvas camera={{ position:[3.5, 11, 11], fov:45 }}
        gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping, clearColor:'#000510', alpha:false }}
        frameloop="always">
        <ChipScene pulseActive={pulseActive} selected={selected} onSelect={setSelected} />
      </Canvas>
      
      <ControlPanel pulseActive={pulseActive} onPulse={handlePulse} selected={selected} />
    </div>
  );
}
