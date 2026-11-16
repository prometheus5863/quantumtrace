// src/components/StudioEnv.jsx
// Reflections without a network request: drei's HDRI presets are fetched from a CDN at runtime,
// and the whole canvas fails if that CDN is unreachable. This builds a small studio from light panels instead.
import { Environment, Lightformer } from '@react-three/drei';

const LOOKS = {
  studio:    { key: '#ffffff', fill: '#9ec8ff', rim: '#ffffff', power: 1 },
  night:     { key: '#6fb6ff', fill: '#2a3cff', rim: '#ff5ad1', power: 0.55 },
  warehouse: { key: '#fff1d6', fill: '#ffc27a', rim: '#ffffff', power: 0.9 },
};

export default function StudioEnv({ look = 'studio' }) {
  const l = LOOKS[look] ?? LOOKS.studio;
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#020309']} />
      <Lightformer form="rect" intensity={4 * l.power} color={l.key}  position={[0, 6, 2]}   scale={[10, 4, 1]} rotation-x={Math.PI / 2} />
      <Lightformer form="rect" intensity={2 * l.power} color={l.fill} position={[-7, 1, 2]}  scale={[4, 8, 1]}  rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={2 * l.power} color={l.rim}  position={[7, 2, -2]}  scale={[4, 8, 1]}  rotation-y={-Math.PI / 2} />
      <Lightformer form="ring" intensity={3 * l.power} color={l.rim}  position={[0, 2, -8]}  scale={4} />
      <Lightformer form="rect" intensity={1 * l.power} color={l.fill} position={[0, -5, 0]}  scale={[12, 12, 1]} rotation-x={-Math.PI / 2} />
    </Environment>
  );
}
