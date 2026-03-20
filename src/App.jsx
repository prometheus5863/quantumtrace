// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import NarrativePage       from './pages/NarrativePage';
import CasingSim           from './pages/sim/CasingSim';
import FridgeSim           from './pages/sim/FridgeSim';
import ChipSim             from './pages/sim/ChipSim';
import GatesSim            from './pages/sim/GatesSim';
import TranspilationSim    from './pages/sim/TranspilationSim';

export default function App() {
  return (
    <Routes>
      <Route path="/"                    element={<NarrativePage />} />
      <Route path="/sim/casing"          element={<CasingSim />} />
      <Route path="/sim/fridge"          element={<FridgeSim />} />
      <Route path="/sim/chip"            element={<ChipSim />} />
      <Route path="/sim/gates"           element={<GatesSim />} />
      <Route path="/sim/transpilation"   element={<TranspilationSim />} />
    </Routes>
  );
}
