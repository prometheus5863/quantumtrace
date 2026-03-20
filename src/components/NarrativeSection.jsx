// src/components/NarrativeSection.jsx
import { useNavigate } from 'react-router-dom';
import styles from '../styles/narrative.module.css';

export default function NarrativeSection({ layer, index, total }) {
  const navigate = useNavigate();
  const counter = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <section className={`qt-section ${styles.section}`}>
      <div className={styles.domainBadge}>{layer.domain}</div>
      <div className={styles.layerCounter}>{counter}</div>
      
      <h1 className={`qt-title ${styles.title}`}>
        {layer.scrollTitle}
      </h1>
      
      <p className={`qt-desc ${styles.desc}`}>
        {layer.scrollDesc}
      </p>
      
      <button 
        className={`qt-btn ${styles.learnMoreBtn}`}
        onClick={() => navigate(layer.route)}
      >
        Explore Simulation
      </button>
    </section>
  );
}
