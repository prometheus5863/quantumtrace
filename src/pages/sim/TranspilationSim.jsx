// src/pages/sim/TranspilationSim.jsx
// Routing one two-qubit gate on real hardware. A CX can only act on qubits that share a coupler,
// so when the control and target are far apart the transpiler has to walk one of them across the chip
// with SWAPs. This page does the simplest honest version of that: breadth-first shortest path on the
// Eagle heavy-hex map, then counts what the detour costs.
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import StudioEnv from '../../components/StudioEnv';
import { buildHeavyHex, shortestPath, routingCost } from '../../lib/heavyHex';

const EAGLE = buildHeavyHex(1.05);
const PRESETS = [[0, 126], [37, 51], [14, 112], [60, 64], [5, 121]];

function QubitNode({ qubit, role, onPick }) {
  const meshRef = useRef();
  const color = { control: '#ffffff', target: '#ff00aa', path: '#00ff88', idle: '#0a6f99' }[role];
  const glow = { control: 6, target: 6, path: 4.5, idle: 1.2 }[role];

  useFrame((state) => {
    if (!meshRef.current) return;
    const pulse = role === 'idle' ? 1 : 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.12;
    meshRef.current.scale.setScalar((role === 'idle' ? 1 : 1.5) * pulse);
  });

  return (
    <mesh ref={meshRef} position={qubit.pos}
      onClick={(e) => { e.stopPropagation(); onPick(qubit.id); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}>
      <boxGeometry args={[0.32, 0.32, 0.32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.9} roughness={0.1} />
    </mesh>
  );
}

function CouplingEdge({ a, b, active }) {
  const p = EAGLE.qubits[a].pos, q = EAGLE.qubits[b].pos;
  const along = p[0] !== q[0];
  return (
    <mesh position={[(p[0] + q[0]) / 2, 0, (p[2] + q[2]) / 2]}>
      <boxGeometry args={along ? [1.05, active ? 0.12 : 0.04, active ? 0.12 : 0.04] : [active ? 0.12 : 0.04, active ? 0.12 : 0.04, 1.05]} />
      <meshStandardMaterial color={active ? '#00ff88' : '#ffffff'} emissive={active ? '#00ff88' : '#00ccff'}
        emissiveIntensity={active ? 3 : 0.25} transparent opacity={active ? 0.95 : 0.25} />
    </mesh>
  );
}

function TranspilationScene({ control, target, shown, onPick }) {
  const onPath = useMemo(() => new Set(shown), [shown]);
  const litEdges = useMemo(() => {
    const s = new Set();
    for (let i = 1; i < shown.length; i++) s.add([shown[i - 1], shown[i]].sort((x, y) => x - y).join('-'));
    return s;
  }, [shown]);

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ccff" />
      <StudioEnv look="night" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#000810" metalness={0.9} roughness={0.1} />
      </mesh>
      <gridHelper args={[30, 30, '#003366', '#001122']} position={[0, -0.48, 0]} />

      {EAGLE.qubits.map((q) => (
        <QubitNode key={q.id} qubit={q} onPick={onPick}
          role={q.id === control ? 'control' : q.id === target ? 'target' : onPath.has(q.id) ? 'path' : 'idle'} />
      ))}
      {EAGLE.edges.map(([a, b]) => (
        <CouplingEdge key={`${a}-${b}`} a={a} b={b} active={litEdges.has(`${a}-${b}`)} />
      ))}

      <OrbitControls enablePan={false} minDistance={8} maxDistance={28}
        minPolarAngle={0} maxPolarAngle={Math.PI / 2.2} />
    </>
  );
}

function CircuitOverlay({ control, target }) {
  return (
    <div style={{ position:'fixed', top:80, left:32, padding:'20px',
      background:'rgba(0,5,20,0.8)', backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)', borderRadius:8,
      border:'1px solid rgba(0,212,255,0.1)', zIndex:10, width:280, fontFamily:'monospace' }}>
      <div style={{ fontSize:10, letterSpacing:'0.1em', color:'#00d4ff', marginBottom:12 }}>LOGICAL CIRCUIT</div>
      <svg width="240" height="76" viewBox="0 0 240 76">
        <line x1="44" y1="20" x2="230" y2="20" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <line x1="44" y1="56" x2="230" y2="56" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <text x="2" y="23" fontSize="9" fill="#ffffff">Q{control}</text>
        <text x="2" y="59" fontSize="9" fill="#ff00aa">Q{target}</text>
        <rect x="70" y="10" width="20" height="20" fill="rgba(0,212,255,0.2)" stroke="#00d4ff" />
        <text x="80" y="24" fontSize="9" fill="#fff" textAnchor="middle">H</text>
        <circle cx="140" cy="20" r="3.5" fill="#00d4ff" />
        <line x1="140" y1="20" x2="140" y2="63" stroke="#00d4ff" strokeWidth="1" />
        <circle cx="140" cy="56" r="7" fill="none" stroke="#00d4ff" strokeWidth="1" />
        <line x1="133" y1="56" x2="147" y2="56" stroke="#00d4ff" strokeWidth="1" />
      </svg>
      <div style={{ marginTop:10, fontSize:9, color:'rgba(255,255,255,0.45)', lineHeight:'1.5' }}>
        A Bell pair between two qubits. On paper it is two gates. On the chip the CX only works
        if the two qubits share a coupler. Click any two qubits to choose them.
      </div>
    </div>
  );
}

const row = (label, value, color = '#00d4ff') => (
  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, gap:16 }}>
    <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>{label}</span>
    <span style={{ fontSize:10, color }}>{value}</span>
  </div>
);

function ControlPanel({ running, done, onRun, onRandom, distance, progress }) {
  const { swaps, extraCx } = routingCost(distance);
  const reveal = done || running;
  return (
    <div style={{ position:'fixed', bottom:32, left:32, padding:'22px 26px',
      background:'rgba(0,5,20,0.85)', backdropFilter:'blur(20px)',
      WebkitBackdropFilter:'blur(20px)', borderRadius:12,
      border:'1px solid rgba(0,212,255,0.15)', fontFamily:'monospace', zIndex:100, minWidth:320 }}>
      <div style={{ fontSize:11, letterSpacing:'0.15em', color:'#00d4ff', fontWeight:600,
        textTransform:'uppercase', marginBottom:4 }}>ROUTING ONE CX</div>
      <div style={{ fontSize:9, letterSpacing:'0.1em', color:'rgba(0,212,255,0.6)',
        marginBottom:16, textTransform:'uppercase' }}>SHORTEST PATH ON HEAVY-HEX</div>

      <div style={{ background:'rgba(0,0,0,0.3)', borderRadius:8, padding:'12px 12px 6px', marginBottom:16 }}>
        {row('COUPLERS APART', reveal ? distance : '?')}
        {row('SWAPS INSERTED', reveal ? swaps : '?', '#ff00aa')}
        {row('EXTRA CX GATES (3 PER SWAP)', reveal ? `+${extraCx}` : '?', '#ff00aa')}
        {row('CX GATES, LOGICAL → PHYSICAL', reveal ? `1 → ${1 + extraCx}` : '1 → ?', '#00ff88')}
        <div style={{ width:'100%', height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, margin:'4px 0 8px' }}>
          <div style={{ width:`${progress * 100}%`, height:'100%', background:'#00d4ff', borderRadius:2 }} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:8 }}>
        <button onClick={onRun} disabled={running} style={{
          padding:'12px 0', background: running ? 'rgba(0,180,255,0.08)' : 'rgba(0,212,255,0.12)',
          border:`1px solid ${running ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.5)'}`,
          borderRadius:6, color:'#00d4ff', fontSize:11, letterSpacing:'0.1em',
          cursor: running ? 'not-allowed' : 'pointer', fontFamily:'monospace',
          textTransform:'uppercase', fontWeight:500 }}>
          {running ? 'ROUTING...' : done ? 'ROUTE AGAIN' : 'ROUTE THE CX'}
        </button>
        <button onClick={onRandom} disabled={running} style={{
          padding:'12px 0', background:'transparent', border:'1px solid rgba(255,255,255,0.25)',
          borderRadius:6, color:'rgba(255,255,255,0.75)', fontSize:10, letterSpacing:'0.1em',
          cursor: running ? 'not-allowed' : 'pointer', fontFamily:'monospace', textTransform:'uppercase' }}>
          NEW PAIR
        </button>
      </div>

      <div style={{ marginTop:14, fontSize:9, color:'rgba(255,255,255,0.4)', lineHeight:1.5, maxWidth:320 }}>
        This is the naive bound. Production transpilers (SABRE and its successors) also choose where
        logical qubits start and route many gates at once, so they usually beat it.
      </div>
    </div>
  );
}

export default function TranspilationSim() {
  const [pair, setPair] = useState(PRESETS[0]);
  const [picking, setPicking] = useState(null);       // first qubit of a pair being chosen by clicks
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preset, setPreset] = useState(0);

  const [control, target] = pair;
  const path = useMemo(() => shortestPath(EAGLE.neighbors, control, target), [control, target]);
  const distance = path.length - 1;
  const shown = useMemo(
    () => (progress === 0 ? [] : path.slice(0, 1 + Math.round(progress * distance))),
    [path, progress, distance]
  );

  useEffect(() => {
    if (!running) return undefined;
    const start = window.performance.now();
    const duration = 400 + distance * 140;
    let raf = 0;
    const tick = () => {
      const p = Math.min((window.performance.now() - start) / duration, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setRunning(false);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, distance]);

  const handleRun = useCallback(() => { if (!running) { setProgress(0); setRunning(true); } }, [running]);
  const handleRandom = useCallback(() => {
    const next = (preset + 1) % PRESETS.length;
    setPreset(next); setPair(PRESETS[next]); setPicking(null); setProgress(0);
  }, [preset]);
  const handlePick = useCallback((id) => {
    if (running) return;
    setProgress(0);
    if (picking === null) { setPicking(id); setPair([id, id]); }
    else if (id !== picking) { setPair([picking, id]); setPicking(null); }
  }, [running, picking]);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => { window.location.hash = '#/'; }} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>

      <CircuitOverlay control={control} target={target} />

      <Canvas camera={{ position:[0, 13, 13], fov:45 }}
        gl={{ clearColor:'#000810', alpha:false }}
        frameloop="always">
        <TranspilationScene control={control} target={target} shown={shown} onPick={handlePick} />
      </Canvas>

      <ControlPanel running={running} done={progress === 1} onRun={handleRun} onRandom={handleRandom}
        distance={Math.max(distance, 0)} progress={progress} />
    </div>
  );
}
