// src/lib/heavyHex.js
// The 127-qubit heavy-hex coupling map used by IBM's Eagle processors.
// Seven long rows of qubits joined by four "bridge" qubits between each pair of rows.
// Qubits are numbered row by row, bridges in between, which matches IBM's own numbering:
// 127 qubits, 144 couplers, every qubit has degree 1, 2 or 3.

const ROWS = 7;
const rowCols = (r) => (r === 0 ? [0, 13] : r === ROWS - 1 ? [1, 14] : [0, 14]);
const bridgeCols = (r) => (r % 2 === 0 ? [0, 4, 8, 12] : [2, 6, 10, 14]);

export function buildHeavyHex(spacing = 1) {
  const qubits = [];            // { id, col, row, bridge, pos: [x, 0, z] }
  const edges = [];             // [a, b]
  const at = new Map();         // "col,row" -> id
  const add = (col, row, bridge) => {
    const id = qubits.length;
    qubits.push({ id, col, row, bridge, pos: [(col - 7) * spacing, 0, (row - 6) * spacing] });
    at.set(`${col},${row}`, id);
    return id;
  };
  for (let r = 0; r < ROWS; r++) {
    const [c0, c1] = rowCols(r);
    for (let c = c0; c <= c1; c++) {
      const id = add(c, r * 2, false);
      if (c > c0) edges.push([id - 1, id]);
    }
    if (r < ROWS - 1) for (const c of bridgeCols(r)) add(c, r * 2 + 1, true);
  }
  for (const q of qubits) {
    if (!q.bridge) continue;
    edges.push([at.get(`${q.col},${q.row - 1}`), q.id], [q.id, at.get(`${q.col},${q.row + 1}`)]);
  }
  const neighbors = qubits.map(() => []);
  for (const [a, b] of edges) { neighbors[a].push(b); neighbors[b].push(a); }
  return { qubits, edges, neighbors };
}

// Breadth-first shortest path between two physical qubits. Returns the list of qubit ids, ends included.
export function shortestPath(neighbors, from, to) {
  const prev = new Array(neighbors.length).fill(-1);
  const seen = new Array(neighbors.length).fill(false);
  const queue = [from]; seen[from] = true;
  while (queue.length) {
    const q = queue.shift();
    if (q === to) break;
    for (const n of neighbors[q]) if (!seen[n]) { seen[n] = true; prev[n] = q; queue.push(n); }
  }
  const path = [];
  for (let q = to; q !== -1; q = prev[q]) path.unshift(q);
  return path[0] === from ? path : [];
}

// Cost of running one CX between two qubits `distance` couplers apart with naive routing:
// move one qubit next to the other with SWAPs, each SWAP being three CX gates.
export function routingCost(distance) {
  const swaps = Math.max(0, distance - 1);
  return { swaps, extraCx: swaps * 3 };
}
