// src/constants/layers.js

export let activeLayerId = 'casing';
export let scrollProgressMap = {
  casing: 0, fridge: 0, chip: 0, gates: 0, transpilation: 0,
};

export function setActiveLayerId(id) {
  activeLayerId = id;
}

export function setScrollProgress(id, value) {
  scrollProgressMap[id] = value;
}

export const LAYERS = [
  {
    id:          'casing',
    facts:       [['300 K', 'outside'], ['5', 'nested stages inside'], ['~10⁻⁵', 'of room temp at the chip']],
    route:       '/sim/casing',
    scrollTitle: 'Outer Casing',
    scrollDesc:  'Precision-machined aluminum housing. The first line ' +
                 'of thermal defense. Designed to maintain millikelvin ' +
                 'isolation between the quantum processor and ' +
                 'room-temperature electronics.',
    simTitle:    'Thermal Shielding Model',
    simDesc:     'Explore how layered thermal shielding isolates the ' +
                 'quantum processor from ambient heat.',
    particleColor: '#4488ff',
    domain:      'hardware',
  },
  {
    id:          'fridge',
    facts:       [['50 K → 15 mK', 'top to bottom'], ['2.7 K', 'cosmic microwave background'], ['³He / ⁴He', 'mixture does the cooling']],
    route:       '/sim/fridge',
    scrollTitle: 'Dilution Refrigerator',
    scrollDesc:  'Five cascading cooling stages bring internal ' +
                 'temperature to 15 millikelvin — colder than the ' +
                 'cosmic microwave background. The golden chandelier ' +
                 'of superconducting hardware hangs at the base.',
    simTitle:    'Cryogenic Cooling Stages',
    simDesc:     'Interactive model of the dilution refrigerator. ' +
                 'Plates from top to bottom: 50 K, 4 K, still (~0.8 K), ' +
                 'cold plate (~100 mK), mixing chamber (~15 mK).',
    particleColor: '#ffaa00',
    domain:      'hardware',
  },
  {
    id:          'chip',
    facts:       [['127', 'transmon qubits'], ['144', 'couplers'], ['≤ 3', 'neighbours per qubit']],
    route:       '/sim/chip',
    scrollTitle: '127-Qubit Processor',
    scrollDesc:  'The IBM Eagle heavy-hex architecture. 127 ' +
                 'superconducting transmon qubits arranged in a ' +
                 'brick-wall hexagonal lattice. Each qubit: a ' +
                 'Josephson junction cooled to near absolute zero.',
    simTitle:    'Heavy-Hex Qubit Topology',
    simDesc:     'Physical layout explorer. Inspect qubit ' +
                 'connectivity, coupling maps, and error rates.',
    particleColor: '#00ffaa',
    domain:      'hardware',
  },
  {
    id:          'gates',
    facts:       [['~5 GHz', 'qubit frequency'], ['tens of ns', 'per single-qubit gate'], ['Bloch sphere', 'one qubit, one arrow']],
    route:       '/sim/gates',
    scrollTitle: 'EM Control & Gates',
    scrollDesc:  'Hardware drives logic through microwave pulses. ' +
                 'Precisely timed electromagnetic fields rotate ' +
                 'the qubit state vector on the Bloch sphere — ' +
                 'this is how a quantum gate is physically applied.',
    simTitle:    'Gate Pulse & Bloch Sphere',
    simDesc:     'Visualize microwave pulse sequences and their ' +
                 'effect on qubit state. Rotate the Bloch sphere ' +
                 'using single-qubit gates: X, Y, Z, H, Rx, Ry.',
    particleColor: '#ff44aa',
    domain:      'control',
  },
  {
    id:          'transpilation',
    facts:       [['1 SWAP', '= 3 CX gates'], ['shortest path', 'sets the overhead'], ['depth', 'fights coherence time']],
    route:       '/sim/transpilation',
    scrollTitle: 'Circuit Transpilation',
    scrollDesc:  'Abstract quantum circuits cannot run directly on ' +
                 'hardware. The transpiler maps logical qubits onto ' +
                 'physical ones, inserts SWAP gates to route ' +
                 'across connectivity constraints, and optimizes ' +
                 'gate depth for coherence time.',
    simTitle:    'Circuit Mapping Explorer',
    simDesc:     'Watch a logical circuit get routed onto the ' +
                 'heavy-hex topology. See SWAP insertions, ' +
                 'qubit assignment, and gate depth changes.',
    particleColor: '#44ffff',
    domain:      'software',
  },
];
