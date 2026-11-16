// src/components/NarrativeSection.jsx
import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/narrative.module.css';

const NarrativeSection = forwardRef(function NarrativeSection({ layer }, ref) {
  const navigate = useNavigate();
  return (
    <section ref={ref} className={styles.section} style={{ '--accent': layer.particleColor }}>
      <div className={styles.domainBadge}>{layer.domain}</div>
      <h1 className={styles.title}>{layer.scrollTitle}</h1>
      <p className={styles.desc}>{layer.scrollDesc}</p>
      <ul className={styles.facts}>
        {layer.facts.map(([value, label]) => (
          <li key={label}><strong>{value}</strong><span>{label}</span></li>
        ))}
      </ul>
      <button className={styles.learnMoreBtn} onClick={() => navigate(layer.route)}>
        Explore simulation
      </button>
    </section>
  );
});

export default NarrativeSection;
