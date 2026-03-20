// src/components/GlassPanel.jsx
import styles from '../styles/sim.module.css';

export default function GlassPanel({ title, body }) {
  return (
    <div className={styles.glassPanel}>
      <div className={styles.glassPanelTitle}>{title}</div>
      <div className={styles.glassPanelBody}>{body}</div>
    </div>
  );
}
