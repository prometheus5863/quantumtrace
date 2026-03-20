// src/pages/sim/TranspilationSim.jsx
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

const GRID_SIZE = 5;
const SPACING = 2.5;

function QubitNode({ position, active, swapActive }) {
  const meshRef = useRef();
  const color = active ? '#00ff88' : swapActive ? '#ff00ff' : '#00ccff';
  const emissiveIntensity = active ? 5 : swapActive ? 4 : 1.5;

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const pulse = active ? Math.sin(time * 10) * 0.2 + 1 : 1;
    meshRef.current.scale.setScalar(pulse);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity}
        metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function CouplingEdge({ start, end, active }) {
  const meshRef = useRef();
  const midPoint = new THREE.Vector3().addVectors(new THREE.Vector3(...start), new THREE.Vector3(...end)).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start));
  const length = direction.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

  return (
    <mesh position={midPoint} quaternion={quaternion} ref={meshRef}>
      <cylinderGeometry args={[0.05, 0.05, length, 8]} />
      <meshStandardMaterial color={active ? '#00ff88' : '#ffffff'} emissive={active ? '#00ff88' : '#00ccff'}
        emissiveIntensity={active ? 3 : 0.2} transparent opacity={active ? 0.8 : 0.2} />
    </mesh>
  );
}

function TranspilationScene({ running, progress }) {
  const { qubits, edges } = useMemo(() => {
    const q = [];
    const e = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const x = (c - GRID_SIZE / 2) * SPACING;
        const z = (r - GRID_SIZE / 2) * SPACING;
        q.push({ id: `${r}-${c}`, pos: [x, 0, z] });
        if (c < GRID_SIZE - 1) e.push({ start: [x, 0, z], end: [x + SPACING, 0, z] });
        if (r < GRID_SIZE - 1) e.push({ start: [x, 0, z], end: [x, 0, z + SPACING] });
      }
    }
    return { qubits: q, edges: e };
  }, []);

  const activeNodes = useMemo(() => {
    if (!running) return [];
    const count = Math.floor(progress * qubits.length);
    return qubits.slice(0, count).map(q => q.id);
  }, [running, progress, qubits]);

  const activeEdges = useMemo(() => {
    if (!running) return [];
    const count = Math.floor(progress * edges.length);
    return edges.slice(0, count).map((_, i) => i);
  }, [running, progress, edges]);

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ccff" />
      <Environment preset="night" />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#000810" metalness={0.9} roughness={0.1} />
      </mesh>
      
      <gridHelper args={[30, 30, '#003366', '#001122']} position={[0, -0.48, 0]} />
      
      {qubits.map(q => <QubitNode key={q.id} position={q.pos} active={activeNodes.includes(q.id)} />)}
      {edges.map((e, i) => <CouplingEdge key={i} start={e.start} end={e.end} active={activeEdges.includes(i)} />)}
      
      <OrbitControls enablePan={false} minDistance={10} maxDistance={25}
        minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
    </>
  );
}

function LogicalCircuitOverlay() {
  return (
    <div style={{ position:'fixed', top:80, left:32, padding:'20px',
      background:'rgba(0,5,20,0.8)', backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)', borderRadius:8,
      border:'1px solid rgba(0,212,255,0.1)', zIndex:10, width:280 }}>
      <div style={{ fontSize:10, letterSpacing:'0.1em', color:'#00d4ff', marginBottom:12 }}>LOGICAL CIRCUIT (QASM)</div>
      <svg width="240" height="120" viewBox="0 0 240 120">
        <line x1="10" y1="20" x2="230" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1="10" y1="50" x2="230" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1="10" y1="80" x2="230" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        
        {/* Gates */}
        <rect x="30" y="10" width="20" height="20" fill="rgba(0,212,255,0.2)" stroke="#00d4ff" />
        <text x="40" y="24" fontSize="8" fill="#fff" textAnchor="middle">H</text>
        
        <circle cx="80" cy="20" r="3" fill="#00d4ff" />
        <line x1="80" y1="20" x2="80" y2="50" stroke="#00d4ff" strokeWidth="1" />
        <circle cx="80" cy="50" r="6" fill="none" stroke="#00d4ff" strokeWidth="1" />
        <line x1="74" y1="50" x2="86" y2="50" stroke="#00d4ff" strokeWidth="1" />
        <line x1="80" y1="44" x2="80" y2="56" stroke="#00d4ff" strokeWidth="1" />
        
        <rect x="120" y="70" width="20" height="20" fill="rgba(255,0,255,0.2)" stroke="#ff00ff" />
        <text x="130" y="84" fontSize="8" fill="#fff" textAnchor="middle">X</text>
        
        <line x1="160" y1="50" x2="160" y2="80" stroke="#00ff88" strokeWidth="1" />
        <circle cx="160" cy="50" r="4" fill="none" stroke="#00ff88" strokeWidth="1" />
        <circle cx="160" cy="80" r="4" fill="none" stroke="#00ff88" strokeWidth="1" />
        <text x="175" y="68" fontSize="7" fill="#00ff88">SWAP</text>
      </svg>
      <div style={{ marginTop:12, fontSize:9, color:'rgba(255,255,255,0.4)', lineHeight:'1.4' }}>
        SABRE Algorithm: Mapping logical qubits to physical lattice topology while minimizing SWAP overhead.
      </div>
    </div>
  );
}

function ControlPanel({ running, onRun, progress }) {
  return (
    <div style={{ position:'fixed', bottom:32, left:32, padding:'22px 26px',
      background:'rgba(0,5,20,0.85)', backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)', borderRadius:12,
      border:'1px solid rgba(0,212,255,0.15)', fontFamily:'monospace', zIndex:100, minWidth:320 }}>
      <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#00d4ff', fontWeight:600,
        textTransform:'uppercase', marginBottom:4 }}>TRANSPILATION ENGINE</div>
      <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(0,212,255,0.6)',
        marginBottom:16, textTransform:'uppercase' }}>SABRE ROUTING ALGORITHM</div>
      
      <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:12, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>SWAP OVERHEAD</span>
          <span style={{ fontSize:10, color:'#ff00ff' }}>+12 GATES</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>DEPTH REDUCTION</span>
          <span style={{ fontSize:10, color:'#00ff88' }}>14.2%</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>ROUTING PROGRESS</span>
          <span style={{ fontSize:10, color:'#00d4ff' }}>{Math.floor(progress * 100)}%</span>
        </div>
        <div style={{ width:'100%', height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, marginTop:10 }}>
          <div style={{ width:`${progress * 100}%`, height:'100%', background:'#00d4ff', borderRadius:2, transition:'width 0.1s linear' }} />
        </div>
      </div>

      <button onClick={onRun} disabled={running} style={{
        width:'100%', padding:'12px 0',
        background: running ? 'rgba(0,180,255,0.08)' : 'rgba(0,212,255,0.12)',
        border:`1px solid ${running ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.5)'}`,
        borderRadius:6, color:'#00d4ff', fontSize:11, letterSpacing:'0.1em',
        cursor: running ? 'not-allowed' : 'pointer', fontFamily:'monospace',
        textTransform:'uppercase', fontWeight:500 }}>
        {running ? 'TRANSPILING CIRCUIT...' : progress === 1 ? 'RE-RUN TRANSPILATION' : 'RUN SABRE ROUTING'}
      </button>

      <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[['OPTIMIZATION','LEVEL 3'],['LAYOUT','DENSE'],['SEED','0x4F2A']].map(([label,val],i)=>(
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

export default function TranspilationSim() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (!running) return;
    const start = window.performance.now();
    const DURATION = 3000;
    const tick = () => {
      const p = Math.min((window.performance.now() - start) / DURATION, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setRunning(false);
    };
    requestAnimationFrame(tick);
  }, [running]);

  const handleRun = useCallback(() => {
    if (running) return;
    setProgress(0);
    setRunning(true);
  }, [running]);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => window.history.back()} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <LogicalCircuitOverlay />
      
      <Canvas camera={{ position:[0, 10, 15], fov:45 }}
        gl={{ clearColor:'#000810', alpha:false }}
        frameloop="always">
        <TranspilationScene running={running} progress={progress} />
      </Canvas>
      
      <ControlPanel running={running} onRun={handleRun} progress={progress} />
    </div>
  );
}
