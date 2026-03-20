// src/pages/sim/GatesSim.jsx
import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

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
      <Text position={[0, 3.5, 0]} fontSize={0.4} color="#ffffff">|0⟩</Text>
      <Text position={[0, -3.5, 0]} fontSize={0.4} color="#ffffff">|1⟩</Text>
      <Text position={[3.5, 0, 0]} fontSize={0.4} color="#ffffff">|+⟩</Text>
      <Text position={[-3.5, 0, 0]} fontSize={0.4} color="#ffffff">|-⟩</Text>
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
      <Environment preset="night" />
      
      <BlochSphere stateVector={stateVector} />
      <TransmonQubits />
      
      <OrbitControls enablePan={false} minDistance={5} maxDistance={15} />
    </>
  );
}

function ControlPanel({ stateVector, onApplyGate }) {
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
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)' }}>COORDINATES</span>
          <span style={{ fontSize:10, color:'#00ff88' }}>
            ({Math.sin(stateVector.theta)*Math.cos(stateVector.phi).toFixed(2)}, 
             {Math.cos(stateVector.theta).toFixed(2)}, 
             {Math.sin(stateVector.theta)*Math.sin(stateVector.phi).toFixed(2)})
          </span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          { name: 'X Gate', gate: 'X', desc: 'Pauli-X (NOT)' },
          { name: 'H Gate', gate: 'H', desc: 'Hadamard' },
          { name: 'Z Gate', gate: 'Z', desc: 'Pauli-Z' },
          { name: 'T Gate', gate: 'T', desc: 'T-Gate (π/4)' }
        ].map((g) => (
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

      <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[['FIDELITY','0.9998'],['DECOHERENCE','LOW'],['PULSE TYPE','DRAG']].map(([label,val],i)=>(
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

export default function GatesSim() {
  const [stateVector, setStateVector] = useState({ theta: 0, phi: 0 });
  
  const handleApplyGate = useCallback((gate) => {
    setStateVector(prev => {
      let { theta, phi } = prev;
      switch (gate) {
        case 'X':
          theta = Math.PI - theta;
          phi = -phi;
          break;
        case 'H':
          // Simplified Hadamard rotation for visualization
          if (theta === 0) theta = Math.PI / 2;
          else if (theta === Math.PI) { theta = Math.PI / 2; phi = Math.PI; }
          else if (theta === Math.PI / 2 && phi === 0) theta = 0;
          else if (theta === Math.PI / 2 && phi === Math.PI) theta = Math.PI;
          else {
            theta = Math.PI / 2;
            phi = (phi + Math.PI) % (2 * Math.PI);
          }
          break;
        case 'Z':
          phi = (phi + Math.PI) % (2 * Math.PI);
          break;
        case 'T':
          phi = (phi + Math.PI / 4) % (2 * Math.PI);
          break;
        default:
          break;
      }
      return { theta, phi };
    });
  }, []);

  return (
    <div style={{ width:'100vw', height:'100vh', background:'#000', position:'relative', overflow:'hidden' }}>
      <button onClick={() => window.history.back()} style={{
        position:'fixed', top:16, left:16, zIndex:200, padding:'7px 16px',
        background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
        borderRadius:2, color:'rgba(255,255,255,0.5)', fontSize:'0.75rem',
        letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>← Back</button>
      
      <Canvas camera={{ position:[0, 0, 10], fov:45 }}
        gl={{ clearColor:'#00020a', alpha:false }}
        frameloop="always">
        <GatesScene stateVector={stateVector} />
      </Canvas>
      
      <ControlPanel stateVector={stateVector} onApplyGate={handleApplyGate} />
    </div>
  );
}
