import type { Metadata } from 'next';
import DilemmaForm from '@/components/DilemmaForm';
import styles from './new.module.css';

export const metadata: Metadata = { title: 'New Session' };

export default function NewDilemmaPage() {
  return (
    <div className={`page-container ${styles.page}`}>
      <div className={styles.header}>
        <p className={`${styles.label} font-display`}>The Council</p>
        <h1 className={`${styles.title} font-display`}>State Your Dilemma</h1>
        <p className={`${styles.body} font-dramatic`}>
          Speak plainly. The council will hear what you say and what you do not say.
          There is no correct format — describe what you are facing in your own words.
        </p>
      </div>

      <hr className="divider divider-gold" />

      <DilemmaForm />
    </div>
  );
}
