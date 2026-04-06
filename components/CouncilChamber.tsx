'use client';

import { useState, type FormEvent } from 'react';
import type { DbSession, DbCouncilTurn, PersonaId } from '@/lib/types';
import { PERSONA_ORDER, PERSONA_META } from '@/lib/council/personas';
import VoiceCard from './VoiceCard';
import styles from './CouncilChamber.module.css';

interface Props {
  session: DbSession;
  turns: DbCouncilTurn[];
  sessionId: string;
}

type Tab = 'round1' | 'round2' | 'summary';

export default function CouncilChamber({ session, turns, sessionId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('round1');
  const [ruling, setRuling] = useState(session.ruling ?? '');
  const [title, setTitle] = useState(session.title ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const round1 = turns.filter((t) => t.round_number === 1);
  const round2 = turns.filter((t) => t.round_number === 2);

  // Order round 1 by persona order
  const round1Ordered = PERSONA_ORDER
    .map((id) => round1.find((t) => t.persona_id === id))
    .filter(Boolean) as DbCouncilTurn[];

  const round2Ordered = PERSONA_ORDER
    .map((id) => round2.find((t) => t.persona_id === id))
    .filter(Boolean) as DbCouncilTurn[];

  async function saveRuling(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruling, title: title || undefined }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'round1', label: 'Round I — The Voices' },
    { key: 'round2', label: 'Round II — The Debate' },
    { key: 'summary', label: 'The Synthesis' },
  ];

  return (
    <div className={styles.chamber}>
      {/* Tab Navigation */}
      <div className={styles.tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''} font-display`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Round 1 ─────────────────────────────────────────────────────────── */}
      {activeTab === 'round1' && (
        <section className={styles.section}>
          <p className={`${styles.sectionNote} font-dramatic`}>
            Five voices speak independently to your dilemma.
          </p>
          <div className={styles.voiceGrid}>
            {round1Ordered.map((turn) => (
              <VoiceCard key={turn.id} turn={turn} round={1} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Round 2 ─────────────────────────────────────────────────────────── */}
      {activeTab === 'round2' && (
        <section className={styles.section}>
          <p className={`${styles.sectionNote} font-dramatic`}>
            Each voice now challenges one other, sharpening the debate.
          </p>
          {round2Ordered.length === 0 ? (
            <p className={styles.emptyNote}>The second round is not yet recorded.</p>
          ) : (
            <div className={styles.voiceGrid}>
              {round2Ordered.map((turn) => (
                <VoiceCard key={turn.id} turn={turn} round={2} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── Summary ─────────────────────────────────────────────────────────── */}
      {activeTab === 'summary' && (
        <section className={styles.section}>
          {session.council_summary ? (
            <div className={styles.summaryBlock}>
              <p className={`${styles.summaryLabel} font-display`}>Council Summary</p>
              <div className={`${styles.summaryText} prose`}>
                {session.council_summary.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.emptyNote}>No summary available for this session.</p>
          )}
        </section>
      )}

      {/* ─── Ruling Form ─────────────────────────────────────────────────────── */}
      <div className={styles.rulingSection}>
        <div className="ornament" style={{ marginBottom: '32px' }}>
          <span className={`font-display ${styles.rulingOrnamentText}`}>
            Record Your Ruling
          </span>
        </div>

        <form className={styles.rulingForm} onSubmit={saveRuling}>
          <div className={styles.rulingField}>
            <label htmlFor="session-title" className={`${styles.rulingLabel} font-display`}>
              Session Title
            </label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this session a name"
              maxLength={120}
            />
          </div>

          <div className={styles.rulingField}>
            <label htmlFor="ruling" className={`${styles.rulingLabel} font-display`}>
              Your Reflection
            </label>
            <textarea
              id="ruling"
              value={ruling}
              onChange={(e) => setRuling(e.target.value)}
              rows={6}
              placeholder="What does the council's deliberation reveal to you? What will you do? What did you learn?"
              maxLength={5000}
            />
          </div>

          <div className={styles.rulingFooter}>
            <button
              type="submit"
              className={`${styles.saveBtn} font-display`}
              disabled={saving}
            >
              {saving ? 'Recording...' : saved ? 'Recorded' : 'Record the Ruling'}
            </button>
            {saved && (
              <span className={`${styles.savedConfirm} font-dramatic`}>
                The ruling has been recorded.
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
