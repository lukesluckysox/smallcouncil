import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/db';
import type { SessionListItem } from '@/lib/types';
import SessionList from '@/components/SessionList';
import EmptyState from '@/components/EmptyState';
import styles from './dashboard.module.css';

export const metadata: Metadata = { title: 'The Chamber' };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const recentSessions = await query<SessionListItem>(
    `SELECT
       s.id, s.title, s.dilemma, s.status, s.created_at,
       COUNT(ct.id)::int AS turn_count
     FROM sessions s
     LEFT JOIN council_turns ct ON ct.session_id = s.id
     WHERE s.user_id = $1
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT 5`,
    [user.id]
  );

  return (
    <div className={`page-container ${styles.page}`}>
      {/* Welcome */}
      <div className={styles.welcome}>
        <p className={`${styles.welcomeLabel} font-display`}>The Chamber</p>
        <h1 className={`${styles.welcomeTitle} font-display`}>
          What weighs on you?
        </h1>
        <p className={`${styles.welcomeBody} font-dramatic`}>
          The council is assembled. Bring your dilemma forward.
        </p>
        <Link href="/dilemma/new" className={styles.newBtn}>
          <span className="font-display">Convene a New Session</span>
        </Link>
      </div>

      <hr className="divider divider-gold" />

      {/* Recent Sessions */}
      <div className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <h2 className={`${styles.recentTitle} font-display`}>Recent Sessions</h2>
          {recentSessions.length > 0 && (
            <Link href="/archive" className={styles.archiveLink}>
              View all sessions →
            </Link>
          )}
        </div>

        {recentSessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            body="Your first council session will appear here."
          />
        ) : (
          <SessionList sessions={recentSessions} />
        )}
      </div>
    </div>
  );
}
