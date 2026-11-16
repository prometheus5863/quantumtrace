// src/pages/NarrativePage.jsx
// One tall, empty scroll track drives everything. Each layer owns one viewport-height of it:
// its text fades in, the camera zooms through its scene, the text fades out, the next layer takes over.
// The text lives in a single fixed overlay, so two layers can never be on screen at once.
import { useEffect, useRef, useState } from 'react';
import { LAYERS, setActiveLayerId, setScrollProgress } from '../constants/layers';
import NarrativeCanvas from '../components/NarrativeCanvas';
import NarrativeSection from '../components/NarrativeSection';
import styles from '../styles/narrative.module.css';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default function NarrativePage() {
  const blocks = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const pos = Math.max(0, window.scrollY) / window.innerHeight;          // in "layers"
      const index = Math.min(LAYERS.length - 1, Math.floor(pos));
      const local = Math.min(1, pos - index);
      LAYERS.forEach((layer, i) => {
        const p = i < index ? 1 : i > index ? 0 : local;
        setScrollProgress(layer.id, p);
        const el = blocks.current[i];
        if (!el) return;
        const fadeIn = i === 0 ? 1 : smooth(0.04, 0.2, p);
        const fadeOut = i === LAYERS.length - 1 ? 1 : 1 - smooth(0.78, 0.94, p);
        const o = i === index ? fadeIn * fadeOut : 0;
        el.style.opacity = o;
        el.style.transform = `translateY(${(1 - fadeIn) * 28 - (1 - fadeOut) * 28}px)`;
        el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      });
      setActiveLayerId(LAYERS[index].id);
      setActiveIndex(index);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const goTo = (i) => window.scrollTo({ top: (i + 0.35) * window.innerHeight, behavior: 'smooth' });

  return (
    <main>
      <NarrativeCanvas />

      <div className={styles.brand}>QuantumTrace <span>· Qant Labs</span></div>
      <div className={styles.layerCounter}>
        {String(activeIndex + 1).padStart(2, '0')} / {String(LAYERS.length).padStart(2, '0')}
      </div>

      <nav className={styles.progressDots} aria-label="Layers">
        {LAYERS.map((layer, i) => (
          <button
            key={layer.id}
            className={`${styles.dot} ${activeIndex === i ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={layer.scrollTitle}
            title={layer.scrollTitle}
          />
        ))}
      </nav>

      <div className={styles.overlay}>
        {LAYERS.map((layer, i) => (
          <NarrativeSection key={layer.id} layer={layer} ref={(el) => { blocks.current[i] = el; }} />
        ))}
      </div>

      <div className={`${styles.scrollHint} ${activeIndex === 0 ? '' : styles.scrollHintHidden}`}>scroll to descend</div>

      {/* the scroll track: one viewport per layer, plus one so the last layer gets its full zoom */}
      <div style={{ height: `${(LAYERS.length + 1) * 100}vh` }} />
    </main>
  );
}
