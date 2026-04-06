import type { Metadata } from 'next';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Convene the Council' };

export default function SignupPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.top}>
          <Link href="/" className={`${styles.wordmark} font-display`}>
            Small Council
          </Link>
          <h1 className={`${styles.heading} font-display`}>Convene the Council</h1>
          <p className={`${styles.subheading} font-dramatic`}>
            Your sessions are private. Your archive belongs only to you.
          </p>
        </div>

        <AuthForm mode="signup" />

        <p className={styles.switchPrompt}>
          Already have an account?{' '}
          <Link href="/login" className={styles.switchLink}>
            Return to the chamber
          </Link>
        </p>
      </div>
    </div>
  );
}
