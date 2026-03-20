// src/components/SimLayout.jsx
import { useNavigate } from 'react-router-dom';
import { LAYERS } from '../constants/layers';
import GlassPanel from './GlassPanel';
import styles from '../styles/sim.module.css';

export default function SimLayout({ layerId, children }) {
  const navigate = useNavigate();
  const layer = LAYERS.find(l => l.id === layerId);

  if (!layer) return null;

  return (
    <div className={styles.simContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>{layer.simTitle}</div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          ← Back
        </button>
      </header>

      <div className={styles.canvasWrapper}>
        {children}
      </div>

      <GlassPanel 
        title={layer.simTitle} 
        body={layer.simDesc} 
      />
    </div>
  );
}
