// src/components/ParticleField.jsx
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAYERS, activeLayerId, scrollProgressMap } from '../constants/layers';

export default function ParticleField({ count = 150, opacity = 0.25 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const particlesRef = useRef([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const targetColor = useMemo(() => new THREE.Color(), []);

  // Initialize particles once on mount to satisfy purity rules
  useEffect(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20 - 10;
      temp.push({ x, y, z });
    }
    particlesRef.current = temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current || particlesRef.current.length === 0) return;

    // Parallax zoom: scale the whole field based on average scroll progress
    const progressValues = Object.values(scrollProgressMap);
    const avgProgress = progressValues.length > 0 
      ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length 
      : 0;
    
    // Spread particles out as we zoom in
    const scale = 1 + avgProgress * 0.5;
    meshRef.current.scale.setScalar(scale);

    // Rotate group
    meshRef.current.rotation.y += delta * 0.02;
    meshRef.current.rotation.x += delta * 0.005;

    // Update instances
    particlesRef.current.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Color lerp
    const currentLayer = LAYERS.find(l => l.id === activeLayerId);
    if (currentLayer && materialRef.current) {
      targetColor.set(currentLayer.particleColor);
      materialRef.current.color.lerp(targetColor, 0.02);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshBasicMaterial ref={materialRef} color="#4488ff" transparent opacity={opacity} />
    </instancedMesh>
  );
}
