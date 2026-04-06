import type { Metadata } from 'next';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Enter the Chamber' };

export default function LoginPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.top}>
          <Link href="/" className={`${styles.wordmark} font-display`}>
            Small Council
          </Link>
          <h1 className={`${styles.heading} font-display`}>Enter the Chamber</h1>
          <p className={`${styles.subheading} font-dramatic`}>
            The council remembers those who have convened before.
          </p>
        </div>

        <AuthForm mode="login" />

        <p className={styles.switchPrompt}>
          No account?{' '}
          <Link href="/signup" className={styles.switchLink}>
            Begin your first session
          </Link>
        </p>
      </div>
    </div>
  );
}
