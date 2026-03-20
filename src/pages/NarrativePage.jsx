// src/pages/NarrativePage.jsx
import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LAYERS, setActiveLayerId } from '../constants/layers';
import NarrativeCanvas from '../components/NarrativeCanvas';
import NarrativeSection from '../components/NarrativeSection';
import styles from '../styles/narrative.module.css';

// We update the module-level variable for the Canvas to read
// But we also need local state for the progress dots UI
export default function NarrativePage() {
  const containerRef = useRef(null);
  const [activeId, setActiveId] = useState(LAYERS[0].id);

  useGSAP(() => {
    const sections = gsap.utils.toArray('.qt-section');

    // Initial state
    gsap.set('.qt-title', { opacity: 0, y: 30 });
    gsap.set('.qt-desc',  { opacity: 0, y: 20 });
    gsap.set('.qt-btn',   { opacity: 0, y: 10 });

    sections.forEach((section, i) => {
      const layer = LAYERS[i];

      // NEW: progress tracker for zoom
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true, // direct, no lag on zoom
        onUpdate: (self) => {
          import('../constants/layers').then(m => {
            m.scrollProgressMap[layer.id] = self.progress;
          });
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger:    section,
          start:      'top top',
          end:        'bottom top',
          pin:        true,
          pinSpacing: false,
          scrub:      1.5,
          onEnter:     () => { 
            // Update module-level bridge
            setActiveLayerId(layer.id);
            setActiveId(layer.id);
          },
          onEnterBack: () => { 
            setActiveLayerId(layer.id);
            setActiveId(layer.id);
          },
        }
      });

      tl.to(section.querySelector('.qt-title'), 
            { opacity: 1, y: 0, duration: 0.4 }, 0)
        .to(section.querySelector('.qt-desc'),  
            { opacity: 1, y: 0, duration: 0.4 }, 0.15)
        .to(section.querySelector('.qt-btn'),   
            { opacity: 1, y: 0, duration: 0.3 }, 0.3);
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, { scope: containerRef, revertOnUpdate: true });

  return (
    <main>
      <NarrativeCanvas />
      
      <div className={styles.progressDots}>
        {LAYERS.map(layer => (
          <div 
            key={layer.id} 
            className={`${styles.dot} ${activeId === layer.id ? styles.dotActive : ''}`}
          />
        ))}
      </div>

      <div ref={containerRef} className={styles.scrollContainer}>
        {LAYERS.map((layer, i) => (
          <NarrativeSection 
            key={layer.id} 
            layer={layer} 
            index={i} 
            total={LAYERS.length} 
          />
        ))}
      </div>
    </main>
  );
}
