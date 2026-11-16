// src/lib/bloch.js
// Single-qubit gates as rotations of the Bloch vector (x, y, z), with |0> at z = +1.

const R = (v) => (Math.abs(v) < 1e-12 ? 0 : v);
const C = Math.SQRT1_2;

export const GATES = {
  X: { label: 'X', desc: 'Pauli-X: π about x',        apply: ([x, y, z]) => [x, -y, -z] },
  Y: { label: 'Y', desc: 'Pauli-Y: π about y',        apply: ([x, y, z]) => [-x, y, -z] },
  Z: { label: 'Z', desc: 'Pauli-Z: π about z',        apply: ([x, y, z]) => [-x, -y, z] },
  H: { label: 'H', desc: 'Hadamard: π about (x+z)/√2', apply: ([x, y, z]) => [z, -y, x] },
  S: { label: 'S', desc: 'Phase: π/2 about z',        apply: ([x, y, z]) => [-y, x, z] },
  T: { label: 'T', desc: 'T: π/4 about z',            apply: ([x, y, z]) => [C * (x - y), C * (x + y), z] },
};

export const KET0 = [0, 0, 1];
export const applyGate = (name, v) => GATES[name].apply(v).map(R);

export function describe([x, y, z]) {
  const theta = Math.acos(Math.max(-1, Math.min(1, z)));
  const phi = Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9 ? 0 : (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
  return { theta, phi, p0: (1 + z) / 2, p1: (1 - z) / 2 };
}
