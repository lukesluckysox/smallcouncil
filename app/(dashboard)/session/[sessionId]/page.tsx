import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { queryOne, query } from '@/lib/db';
import type { DbSession, DbCouncilTurn } from '@/lib/types';
import CouncilChamber from '@/components/CouncilChamber';
import styles from './session.module.css';

interface Props {
  params: { sessionId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await queryOne<DbSession>(
    `SELECT title, dilemma FROM sessions WHERE id = ?`,
    [params.sessionId]
  );
  return {
    title: session?.title ?? 'Council Session',
  };
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function SessionPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const session = await queryOne<DbSession>(
    `SELECT * FROM sessions WHERE id = ? AND user_id = ?`,
    [params.sessionId, user!.id]
  );

  if (!session) notFound();

  const rawTurns = await query<DbCouncilTurn & { actions: string | null }>(
    `SELECT * FROM council_turns WHERE session_id = ? ORDER BY round_number ASC, created_at ASC`,
    [params.sessionId]
  );

  // SQLite stores actions as JSON text — parse back to arrays
  const turns: DbCouncilTurn[] = rawTurns.map((t) => ({
    ...t,
    actions: t.actions ? (JSON.parse(t.actions) as string[]) : null,
  }));

  return (
    <div className={`page-container ${styles.page}`}>
      {/* Breadcrumb / back nav */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/archive" className={styles.backLink}>
          ← Archive
        </Link>
        <span className={styles.breadcrumbSep}>·</span>
        <Link href="/dashboard" className={styles.backLink}>
          Chamber
        </Link>
      </nav>

      {/* Session header */}
      <div className={styles.sessionHeader}>
        <div className={styles.sessionMeta}>
          <p className={`${styles.label} font-display`}>Council Session</p>
          <span className={styles.sessionDate}>{formatDate(session!.created_at)}</span>
        </div>

        {session!.title && (
          <h1 className={`${styles.sessionTitle} font-display`}>{session!.title}</h1>
        )}

        {/* Ruling indicator if one exists */}
        {session!.ruling && (
          <div className={styles.rulingIndicator}>
            <span className={`${styles.rulingIndicatorDot}`} />
            <span className={`${styles.rulingIndicatorText} font-display`}>Ruling recorded</span>
          </div>
        )}

        <div className={styles.dilemmaBlock}>
          <p className={`${styles.dilemmaLabel} font-display`}>The Dilemma</p>
          <blockquote className={`${styles.dilemmaText} font-dramatic`}>
            &ldquo;{session!.dilemma}&rdquo;
          </blockquote>
        </div>
      </div>

      <hr className="divider divider-gold" />

      {/* Council Chamber (tabs: Round 1 / Round 2 / Summary) */}
      <CouncilChamber
        session={session!}
        turns={turns}
        sessionId={params.sessionId}
      />
    </div>
  );
}
