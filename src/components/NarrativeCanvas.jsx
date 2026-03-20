import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { activeLayerId, scrollProgressMap } from '../constants/layers';
import ParticleField from './ParticleField';

// --- SCENE A: NarrativeCasing ---
function NarrativeCasing({ zoomProgress }) {
  const groupRef = useRef();
  
  useFrame(() => {
    if (!groupRef.current) return;
    const scaleBoost = 1 + zoomProgress * 0.08;
    groupRef.current.scale.setScalar(scaleBoost);
  });

  return (
    <group ref={groupRef}>
      <RoundedBox args={[3.0, 4.0, 3.0]} radius={0.15}>
        <meshPhysicalMaterial 
          color="#080c12" 
          metalness={0.95} 
          roughness={0.06} 
          envMapIntensity={3} 
        />
      </RoundedBox>
      
      {/* Branding stripe */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[3.1, 0.025, 3.1]} />
        <meshStandardMaterial emissive="#00d4ff" emissiveIntensity={1.2} />
      </mesh>

      {/* Frosted glass panel */}
      <RoundedBox args={[1.8, 2.2, 0.06]} radius={0.05} position={[0, 0, 1.52]}>
        <meshPhysicalMaterial 
          transmission={1} 
          roughness={0.15} 
          thickness={0.3} 
          color="#88bbff" 
          opacity={0.9} 
          transparent 
          userData={{ baseOpacity: 0.9 }}
        />
      </RoundedBox>

      <pointLight position={[0, 0, 0.6]} color="#00aaff" intensity={1.8} distance={3} />
      
      <directionalLight position={[3, 4, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-4, 1, -3]} intensity={0.4} color="#0033ff" />
      <pointLight position={[0, 0, -6]} intensity={0.3} color="#000844" distance={20} />
    </group>
  );
}

// --- SCENE B: NarrativeFridge ---
const FRIDGE_STAGES = [
  { y: 2.2, radius: 2.8, color: '#ffd700' },
  { y: 1.0, radius: 2.2, color: '#ffcc00' },
  { y: 0.0, radius: 1.7, color: '#ffb700' },
  { y: -1.0, radius: 1.2, color: '#ffa500' },
  { y: -1.9, radius: 0.7, color: '#ff8c00' },
];

function NarrativeFridge({ zoomProgress }) {
  const groupRef = useRef();
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffd700',
    metalness: 1,
    roughness: 0.2,
    envMapIntensity: 2
  }), []);

  useFrame(() => {
    if (!groupRef.current) return;
    const scaleBoost = 1 + zoomProgress * 0.08;
    groupRef.current.scale.setScalar(scaleBoost);
  });

  return (
    <group ref={groupRef}>
      {FRIDGE_STAGES.map((stage, i) => (
        <group key={i}>
          <mesh position={[0, stage.y, 0]}>
            <cylinderGeometry args={[stage.radius, stage.radius, 0.05, 64]} />
            <primitive object={goldMaterial} attach="material" color={stage.color} />
          </mesh>
          
          {i < FRIDGE_STAGES.length - 1 && [...Array(6)].map((_, j) => {
            const angle = (j / 6) * Math.PI * 2;
            const r = FRIDGE_STAGES[i+1].radius * 0.8;
            const h = stage.y - FRIDGE_STAGES[i+1].y;
            return (
              <mesh key={j} position={[Math.cos(angle) * r, stage.y - h/2, Math.sin(angle) * r]}>
                <cylinderGeometry args={[0.018, 0.018, h, 8]} />
                <primitive object={goldMaterial} attach="material" />
              </mesh>
            );
          })}
        </group>
      ))}

      {[...Array(3)].map((_, i) => {
        const angle = (i / 3) * Math.PI * 2;
        const r = 2.5;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <cylinderGeometry args={[0.04, 0.04, 5, 8]} />
            <primitive object={goldMaterial} attach="material" />
          </mesh>
        );
      })}

      <ambientLight intensity={0.02} />
      <spotLight position={[0, 8, 2]} intensity={5} angle={0.25} penumbra={0.9} color="#ffffff" />
      <pointLight position={[2, -1, 3]} color="#ff4400" intensity={0.8} />
      <pointLight position={[-2, 2, -2]} color="#4400ff" intensity={1.2} />
    </group>
  );
}

// --- SCENE C: NarrativeChip ---
function generateHeavyHexPositions() {
  const positions = [];
  const LATTICE_SIZE = 6;
  const SPACING = 1.2;
  for (let r = 0; r < LATTICE_SIZE; r++) {
    for (let col = 0; col < LATTICE_SIZE; col++) {
      const x = (col - LATTICE_SIZE / 2) * SPACING;
      const z = (r - LATTICE_SIZE / 2) * SPACING;
      const type = (r + col) % 2 === 0 ? 'data' : 'ancilla';
      positions.push({ id: `${r}-${col}`, pos: [x, 0, z], type });
    }
  }
  return positions;
}

function NarrativeChip({ zoomProgress }) {
  const positions = useMemo(() => generateHeavyHexPositions(), []);
  const meshRef = useRef();
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current || !groupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    const scaleBoost = 1 + zoomProgress * 0.08;
    groupRef.current.scale.setScalar(scaleBoost);

    positions.forEach((p, i) => {
      const pulse = Math.sin(time * 2 + p.pos[0] * 0.5 + p.pos[2] * 0.5) * 0.1 + 1;
      dummy.position.set(...p.pos);
      dummy.scale.setScalar(pulse * 0.8);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} rotation={[-0.2, 0, 0]}>
      <instancedMesh ref={meshRef} args={[null, null, positions.length]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={2} metalness={0.9} roughness={0.1} />
      </instancedMesh>

      <mesh position={[0, -0.4, 0]}>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color="#000816" metalness={0.9} roughness={0.1} />
      </mesh>
      
      <gridHelper args={[10, 10, '#003366', '#001122']} position={[0, -0.38, 0]} />

      <ambientLight intensity={0.02} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#00ccff" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ff00ff" />
    </group>
  );
}

// --- SCENE D: NarrativeGates ---
function NarrativeGates({ zoomProgress }) {
  const group = useRef();
  const vectorRef = useRef();
  const targetVector = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.getElapsedTime();
    
    const scaleBoost = 1 + zoomProgress * 0.08;
    group.current.scale.setScalar(scaleBoost);

    group.current.rotation.y += 0.002;
    
    // Animate state vector directly in useFrame
    const theta = Math.sin(time * 0.5) * Math.PI;
    const phi = time * 0.2;
    
    targetVector.set(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi)
    ).multiplyScalar(2.5);
    
    if (vectorRef.current) {
      vectorRef.current.position.lerp(targetVector, 0.05);
      const dir = vectorRef.current.position.clone().normalize();
      vectorRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial color="#00d4ff" transparent opacity={0.05} wireframe />
      </mesh>
      
      <gridHelper args={[5, 10, '#00d4ff', '#003366']} rotation={[Math.PI / 2, 0, 0]} />
      <gridHelper args={[5, 10, '#00d4ff', '#003366']} />
      
      <group ref={vectorRef}>
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.5, 8]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.12, 0.25, 8]} />
          <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
        </mesh>
      </group>

      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#00d4ff" />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ff00ff" />
    </group>
  );
}

// --- SCENE E: NarrativeTranspilation ---
function NarrativeTranspilation({ zoomProgress }) {
  const meshRef = useRef();
  const groupRef = useRef();
  const lightRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const path = [0, 1, 2, 3, 4, 9, 14, 19, 24];
  const positions = useMemo(() => {
    const pos = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        pos.push([(c - 2) * 1.1, 0, (r - 2) * 1.1]);
      }
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !lightRef.current || !groupRef.current) return;
    const time = state.clock.getElapsedTime();

    const scaleBoost = 1 + zoomProgress * 0.08;
    groupRef.current.scale.setScalar(scaleBoost);

    const pathIndex = Math.floor(time * 2) % path.length;
    const targetPos = positions[path[pathIndex]];
    lightRef.current.position.set(targetPos[0], 0.5, targetPos[2]);
    lightRef.current.intensity = 2;

    positions.forEach((p, i) => {
      dummy.position.set(...p);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[null, null, 25]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#001a44" emissive="#000d33" emissiveIntensity={1} />
      </instancedMesh>

      <pointLight ref={lightRef} color="#00ffff" distance={3} />

      {[...Array(5)].map((_, i) => (
        <group key={i}>
          <mesh position={[0, 0, (i - 2) * 1.1]}>
            <boxGeometry args={[4.5, 0.01, 0.01]} />
            <meshBasicMaterial color="#001133" opacity={0.4} transparent />
          </mesh>
          <mesh position={[(i - 2) * 1.1, 0, 0]}>
            <boxGeometry args={[0.01, 0.01, 4.5]} />
            <meshBasicMaterial color="#001133" opacity={0.4} transparent />
          </mesh>
        </group>
      ))}

      <ambientLight intensity={0.04} />
      <directionalLight position={[2, 5, 3]} intensity={1.2} />
    </group>
  );
}

// --- Scene Switcher ---
const ZOOM_KEYFRAMES = {
  casing: {
    rest: { z: 9,  y: 1.2, fov: 42 },
    end:  { z: 2.5, y: 0.3, fov: 65 },  // close to glass panel
  },
  fridge: {
    rest: { z: 12, y: 2,   fov: 42 },
    end:  { z: 3,  y: -1,  fov: 60 },  // close to bottom processor
  },
  chip: {
    rest: { z: 5,  y: 9,   fov: 50 },  // top-down
    end:  { z: 2,  y: 2,   fov: 70 },  // diving into qubits
  },
  gates: {
    rest: { z: 7,  y: 2,   fov: 45 },
    end:  { z: 2,  y: 0.5, fov: 60 },  // close to bloch sphere
  },
  transpilation: {
    rest: { z: 8,  y: 5,   fov: 45 },
    end:  { z: 2,  y: 1.5, fov: 65 },  // close to grid
  },
};

function SceneSwitcher() {
  const groups = useRef({});
  const opacities = useRef({
    casing: 0,
    fridge: 0,
    chip: 0,
    gates: 0,
    transpilation: 0
  });

  useFrame((state, delta) => {
    const layerId = activeLayerId;
    const progress = scrollProgressMap[layerId] ?? 0;
    
    const keyframe = ZOOM_KEYFRAMES[layerId];
    if (!keyframe) return;
    
    // Ease the progress: use easeInOut so zoom accelerates then decelerates
    const eased = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Target camera position
    const targetZ = THREE.MathUtils.lerp(keyframe.rest.z, keyframe.end.z, eased);
    const targetY = THREE.MathUtils.lerp(keyframe.rest.y, keyframe.end.y, eased);
    const targetFov = THREE.MathUtils.lerp(keyframe.rest.fov, keyframe.end.fov, eased);
    
    // Apply to camera — lerp at speed 0.08 for smooth follow
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.08);
    
    if (Math.abs(state.camera.fov - targetFov) > 0.1) {
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, 0.08);
      state.camera.updateProjectionMatrix();
    }
    
    // Camera always looks at the scene origin
    state.camera.lookAt(0, 0, 0);

    Object.keys(groups.current).forEach(id => {
      const group = groups.current[id];
      if (!group) return;

      const targetOpacity = id === layerId ? 1 : 0;
      opacities.current[id] = THREE.MathUtils.lerp(opacities.current[id], targetOpacity, 0.05);
      
      group.visible = opacities.current[id] > 0.001;
      
      group.rotation.y += delta * 0.08;
      // group.position.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.12; // Removed to avoid conflict with zoom Y

      group.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true;
          const baseOpacity = child.userData.baseOpacity !== undefined ? child.userData.baseOpacity : 1;
          child.material.opacity = opacities.current[id] * baseOpacity;
        }
      });
    });
  });

  return (
    <>
      <group ref={el => groups.current.casing = el}>
        <NarrativeCasing zoomProgress={scrollProgressMap.casing} />
      </group>
      <group ref={el => groups.current.fridge = el}>
        <NarrativeFridge zoomProgress={scrollProgressMap.fridge} />
      </group>
      <group ref={el => groups.current.chip = el}>
        <NarrativeChip zoomProgress={scrollProgressMap.chip} />
      </group>
      <group ref={el => groups.current.gates = el}>
        <NarrativeGates zoomProgress={scrollProgressMap.gates} />
      </group>
      <group ref={el => groups.current.transpilation = el}>
        <NarrativeTranspilation zoomProgress={scrollProgressMap.transpilation} />
      </group>
      <Environment preset="studio" />
    </>
  );
}

export default function NarrativeCanvas() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0.8, 6], fov: 42 }}
        gl={{ clearColor: '#000010', alpha: false, antialias: true }}
        frameloop="always"
      >
        <SceneSwitcher />
        <ParticleField count={150} opacity={0.25} />
      </Canvas>
    </div>
  );
}
