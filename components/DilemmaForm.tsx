'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './DilemmaForm.module.css';

const MAX_CHARS = 2000;

export default function DilemmaForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [dilemma, setDilemma] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const remaining = MAX_CHARS - dilemma.length;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (dilemma.trim().length < 20) {
      setError('Please describe your dilemma in at least 20 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dilemma: dilemma.trim(), title: title.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'The council could not convene. Please try again.');
        setLoading(false);
        return;
      }

      router.push(`/session/${data.sessionId}`);
    } catch {
      setError('A network error occurred. Please try again.');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.convening}>
        <div className={styles.conveningOrb} />
        <p className={`${styles.conveningTitle} font-display`}>
          The council convenes
        </p>
        <p className={`${styles.conveningBody} font-dramatic`}>
          Five voices consider your dilemma. This may take a moment.
        </p>
        <div className={styles.conveningDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Optional title */}
      <div className={styles.field}>
        <label htmlFor="title" className={`${styles.label} font-display`}>
          Session title{' '}
          <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short name for this dilemma"
          maxLength={120}
          disabled={loading}
        />
      </div>

      {/* Dilemma textarea */}
      <div className={styles.field}>
        <label htmlFor="dilemma" className={`${styles.label} font-display`}>
          Your Dilemma
        </label>
        <div className={styles.textareaWrap}>
          <textarea
            id="dilemma"
            value={dilemma}
            onChange={(e) => setDilemma(e.target.value)}
            placeholder="Describe what you are facing. Speak plainly. The more honest you are, the more useful the council will be."
            rows={10}
            maxLength={MAX_CHARS}
            disabled={loading}
            required
          />
          <div
            className={`${styles.charCount} ${remaining < 100 ? styles.charCountWarn : ''}`}
          >
            {remaining} characters remaining
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.footer}>
        <p className={`${styles.footerNote} font-dramatic`}>
          The council will deliberate in two rounds. You will record your ruling after.
        </p>
        <button type="submit" className={`${styles.submitBtn} font-display`}>
          Convene the Council
        </button>
      </div>
    </form>
  );
}
