import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/db';
import type { SessionListItem } from '@/lib/types';
import SessionList from '@/components/SessionList';
import EmptyState from '@/components/EmptyState';
import styles from './archive.module.css';

export const metadata: Metadata = { title: 'The Archive' };

export default async function ArchivePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const sessions = await query<SessionListItem>(
    `SELECT
       s.id, s.title, s.dilemma, s.ruling, s.status, s.created_at,
       CAST(COUNT(ct.id) AS INTEGER) AS turn_count
     FROM sessions s
     LEFT JOIN council_turns ct ON ct.session_id = s.id
     WHERE s.user_id = ?
     GROUP BY s.id
     ORDER BY s.created_at DESC`,
    [user.id]
  );

  return (
    <div className={`page-container ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <p className={`${styles.label} font-display`}>The Archive</p>
          <h1 className={`${styles.title} font-display`}>Your Sessions</h1>
          <p className={`${styles.subtitle} font-dramatic`}>
            {sessions.length > 0
              ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} in the record.`
              : 'The archive awaits your first dilemma.'}
          </p>
        </div>
        <Link href="/dilemma/new" className={styles.newBtn}>
          <span className="font-display">New Session</span>
        </Link>
      </div>

      <hr className="divider divider-gold" />

      {sessions.length === 0 ? (
        <EmptyState
          title="The archive is empty"
          body="Convene your first council session and it will be recorded here."
          action={{ label: 'Begin a Session', href: '/dilemma/new' }}
        />
      ) : (
        <SessionList sessions={sessions} showDate />
      )}
    </div>
  );
}
