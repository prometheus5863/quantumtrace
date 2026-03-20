// src/pages/sim/ChipSim.jsx
import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

const LATTICE_SIZE = 7;
const SPACING = 1.2;

function Qubit({ position, type, pulseActive }) {
  const meshRef = useRef();
  const [active, setActive] = useState(false);
  const baseColor = type === 'data' ? '#00ccff' : '#ff00ff';
  const emissiveIntensity = type === 'data' ? 3.5 : 5.0;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const pulse = pulseActive ? Math.sin(time * 15 + position[0] * 2) * 0.5 + 0.5 : 0;
    meshRef.current.material.emissiveIntensity = emissiveIntensity + pulse * 4;
    meshRef.current.scale.setScalar(1 + pulse * 0.1);
  });

  return (
    <mesh ref={meshRef} position={position} onClick={() => setActive(!active)}>
      <octahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial color={baseColor} emissive={baseColor} emissiveIntensity={emissiveIntensity}
        metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function Coupler({ start, end, pulseActive }) {
  const meshRef = useRef();
  const midPoint = new THREE.Vector3().addVectors(new THREE.Vector3(...start), new THREE.Vector3(...end)).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start));
  const length = direction.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const pulse = pulseActive ? Math.sin(time * 15 + midPoint.x * 2) * 0.5 + 0.5 : 0;
    meshRef.current.material.emissiveIntensity = 0.5 + pulse * 3;
    meshRef.current.material.opacity = 0.3 + pulse * 0.5;
  });

  return (
    <mesh position={midPoint} quaternion={quaternion} ref={meshRef}>
      <cylinderGeometry args={[0.035, 0.035, length, 8]} />
      <meshStandardMaterial color="#ffffff" emissive="#00ccff" emissiveIntensity={0.5} transparent opacity={0.3} />
    </mesh>
  );
}

function HeavyHexLattice({ pulseActive }) {
  const { qubits, couplers } = useMemo(() => {
    const q = [];
    const c = [];
    for (let r = 0; r < LATTICE_SIZE; r++) {
      for (let col = 0; col < LATTICE_SIZE; col++) {
        const x = (col - LATTICE_SIZE / 2) * SPACING;
        const z = (r - LATTICE_SIZE / 2) * SPACING;
        const type = (r + col) % 2 === 0 ? 'data' : 'ancilla';
        q.push({ id: `${r}-${col}`, pos: [x, 0, z], type });
        if (col < LATTICE_SIZE - 1) c.push({ start: [x, 0, z], end: [x + SPACING, 0, z] });
        if (r < LATTICE_SIZE - 1) c.push({ start: [x, 0, z], end: [x, 0, z + SPACING] });
      }
    }
    return { qubits: q, couplers: c };
  }, []);

  return (
    <group>
      {qubits.map(qubit => <Qubit key={qubit.id} position={qubit.pos} type={qubit.type} pulseActive={pulseActive} />)}
      {couplers.map((coupler, i) => <Coupler key={i} start={coupler.start} end={coupler.end} pulseActive={pulseActive} />)}
    </group>
  );
}

function ChipScene({ pulseActive }) {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ccff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
      <Environment preset="night" />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <planeGeometry args={[25, 25]} />
        <meshStandardMaterial color="#000816" metalness={0.9} roughness={0.1} />
      </mesh>
      
      <gridHelper args={[25, 25, '#003366', '#001122']} position={[0, -0.38, 0]} />
      
      <HeavyHexLattice pulseActive={pulseActive} />
      
      <Text position={[0, 4, -8]} fontSize={1.2} color="#00ccff" font="monospace"
        anchorX="center" anchorY="middle">EAGLE PROCESSOR v2.1</Text>
      
      <OrbitControls enablePan={false} minDistance={5} maxDistance={20}
        minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

function ControlPanel({ pulseActive, onPulse }) {
  return (
    <div style={{ position:'fixed', bottom:32, left:32, padding:'22px 26px',
      background:'rgba(0,5,20,0.85)', backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)', borderRadius:12,
      border:'1px solid rgba(0,212,255,0.15)', fontFamily:'monospace', zIndex:100, minWidth:280 }}>
      <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#00d4ff', fontWeight:600,
        textTransform:'uppercase', marginBottom:4 }}>HEAVY-HEX PROCESSOR</div>
      <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(0,212,255,0.6)',
        marginBottom:16, textTransform:'uppercase' }}>IBM EAGLE ARCHITECTURE</div>
      
      <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:12, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>QUBIT COUNT</span>
          <span style={{ fontSize:10, color:'#00d4ff' }}>127</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>TOPOLOGY</span>
          <span style={{ fontSize:10, color:'#00d4ff' }}>HEAVY-HEX</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>AVG FIDELITY</span>
          <span style={{ fontSize:10, color:'#00ff88' }}>99.92%</span>
        </div>
      </div>

      <button onClick={onPulse} disabled={pulseActive} style={{
        width:'100%', padding:'12px 0',
        background: pulseActive ? 'rgba(0,180,255,0.08)' : 'rgba(0,212,255,0.12)',
        border:`1px solid ${pulseActive ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.5)'}`,
        borderRadius:6, color:'#00d4ff', fontSize:11, letterSpacing:'0.1em',
        cursor: pulseActive ? 'not-allowed' : 'pointer', fontFamily:'monospace',
        textTransform:'uppercase', fontWeight:500 }}>
        {pulseActive ? 'PULSE INJECTED...' : 'INJECT MICROWAVE PULSE'}
      </button>

      <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[['COHERENCE','T1: 180μs'],['READOUT','98.5%'],['COUPLING','TUNABLE']].map(([label,val],i)=>(
          <div key={i} style={{ background:'rgba(0,0,0,0.2)', padding:'8px 10px',
            borderRadius:4, gridColumn: i===2 ? 'span 2' : undefined }}>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.4)', letterSpacing:'0.05em', marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:10, color:'#00ff88', letterSpacing:'0.05em' }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChipSim() {
  const [pulseActive, setPulseActive] = useState(false);
  
  const handlePulse = useCallback(() => {
    if (pulseActive) return;
    setPulseActive(true);
    window.setTimeout(() => setPulseActive(false), 2000);
  }, [pulseActive]);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => window.history.back()} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <Canvas camera={{ position:[0, 6, 12], fov:45 }}
        gl={{ antialias:true, toneMapping:THREE.ACESFilmicToneMapping, clearColor:'#000510', alpha:false }}
        frameloop="always">
        <ChipScene pulseActive={pulseActive} />
      </Canvas>
      
      <ControlPanel pulseActive={pulseActive} onPulse={handlePulse} />
    </div>
  );
}
