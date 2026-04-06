import Link from 'next/link';
import type { SessionListItem } from '@/lib/types';
import styles from './SessionList.module.css';

interface Props {
  sessions: SessionListItem[];
  showDate?: boolean;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// A "complete" session has ≥10 council turns (5 R1 + 5 R2)
function sessionIsComplete(turnCount: number): boolean {
  return turnCount >= 10;
}

export default function SessionList({ sessions, showDate }: Props) {
  return (
    <ul className={styles.list}>
      {sessions.map((session) => {
        const preview = session.dilemma.slice(0, 120);
        const truncated = session.dilemma.length > 120;
        const hasRuling = Boolean((session as SessionListItem & { ruling?: string }).ruling);
        const complete = sessionIsComplete(session.turn_count);

        return (
          <li key={session.id}>
            <Link href={`/session/${session.id}`} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemHeader}>
                  <span className={`${styles.itemTitle} font-display`}>
                    {session.title ?? 'Untitled Session'}
                  </span>
                  <div className={styles.badges}>
                    {hasRuling && (
                      <span className={styles.rulingBadge} title="You recorded a ruling">
                        ◆ Ruling
                      </span>
                    )}
                    {session.status === 'archived' && (
                      <span className={styles.archivedBadge}>Archived</span>
                    )}
                    {!complete && (
                      <span className={styles.incompleteBadge}>Incomplete</span>
                    )}
                  </div>
                </div>

                <p className={`${styles.itemPreview} font-dramatic`}>
                  "{preview}{truncated ? '…' : ''}"
                </p>
              </div>

              <div className={styles.itemMeta}>
                <span className={styles.itemDate}>
                  {showDate
                    ? formatDate(session.created_at)
                    : formatTimeAgo(session.created_at)}
                </span>
                <span className={styles.itemArrow}>→</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
