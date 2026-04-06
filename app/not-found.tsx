import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <div className={styles.orb} />
        <p className={`${styles.code} font-display`}>404</p>
        <h1 className={`${styles.title} font-display`}>
          The Chamber Does Not Exist
        </h1>
        <p className={`${styles.body} font-dramatic`}>
          The session you seek is not in the record, or you have wandered
          beyond the council's reach.
        </p>
        <div className={styles.actions}>
          <Link href="/dashboard" className={`${styles.btnPrimary} font-display`}>
            Return to the Chamber
          </Link>
          <Link href="/" className={styles.btnSecondary}>
            Back to the entrance
          </Link>
        </div>
      </div>
    </div>
  );
}
