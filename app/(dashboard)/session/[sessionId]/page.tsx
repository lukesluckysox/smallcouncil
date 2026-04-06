import type { Metadata } from 'next';
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
    `SELECT title, dilemma FROM sessions WHERE id = $1`,
    [params.sessionId]
  );
  return {
    title: session?.title ?? 'Council Session',
  };
}

export default async function SessionPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const session = await queryOne<DbSession>(
    `SELECT * FROM sessions WHERE id = $1 AND user_id = $2`,
    [params.sessionId, user.id]
  );

  if (!session) notFound();

  const turns = await query<DbCouncilTurn>(
    `SELECT * FROM council_turns WHERE session_id = $1 ORDER BY round_number ASC, created_at ASC`,
    [params.sessionId]
  );

  return (
    <div className={`page-container ${styles.page}`}>
      {/* Session header */}
      <div className={styles.sessionHeader}>
        <p className={`${styles.label} font-display`}>Council Session</p>
        {session.title && (
          <h1 className={`${styles.sessionTitle} font-display`}>{session.title}</h1>
        )}
        <div className={styles.dilemmaBlock}>
          <p className={`${styles.dilemmaLabel} font-display`}>The Dilemma</p>
          <blockquote className={`${styles.dilemmaText} font-dramatic`}>
            "{session.dilemma}"
          </blockquote>
        </div>
      </div>

      <hr className="divider divider-gold" />

      {/* Council Chamber (tabs: Round 1 / Round 2 / Summary) */}
      <CouncilChamber
        session={session}
        turns={turns}
        sessionId={params.sessionId}
      />
    </div>
  );
}
