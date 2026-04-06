import type { DbCouncilTurn } from '@/lib/types';
import { PERSONA_META } from '@/lib/council/personas';
import styles from './VoiceCard.module.css';

interface Props {
  turn: DbCouncilTurn;
  round?: 1 | 2;
}

export default function VoiceCard({ turn, round = 1 }: Props) {
  const meta = PERSONA_META[turn.persona_id];
  if (!meta) return null;

  const targetMeta = turn.target_persona_id ? PERSONA_META[turn.target_persona_id] : null;
  const actions: string[] = Array.isArray(turn.actions) ? turn.actions : [];

  return (
    <div
      className={styles.card}
      style={{
        '--persona-color': meta.accentColor,
        '--persona-bg': `${meta.color}18`,
        '--persona-border': `${meta.accentColor}33`,
      } as React.CSSProperties}
    >
      {/* Card header */}
      <div className={styles.header}>
        <div className={styles.identity}>
          <span className={`${styles.name} font-display`}>{meta.name}</span>
          <span className={styles.archetype}>{meta.archetype}</span>
        </div>

        <div className={styles.meta}>
          {round === 1 && turn.confidence != null && (
            <ConfidenceMeter value={turn.confidence} />
          )}
        </div>
      </div>

      {/* Round 2: Challenge banner */}
      {round === 2 && targetMeta && (
        <div
          className={styles.challengeBanner}
          style={{
            '--target-color': targetMeta.accentColor,
            '--target-bg': `${targetMeta.color}22`,
          } as React.CSSProperties}
        >
          <span className={`${styles.challengeFrom} font-display`}>
            {meta.name}
          </span>
          <span className={styles.challengeArrow}>challenges</span>
          <span
            className={`${styles.challengeTo} font-display`}
            style={{ color: targetMeta.accentColor }}
          >
            {targetMeta.name}
          </span>
        </div>
      )}

      {/* Stance title (Round 1) */}
      {round === 1 && turn.stance_title && (
        <div className={`${styles.stanceTitle} font-dramatic`}>
          "{turn.stance_title}"
        </div>
      )}

      {/* Main content */}
      <div className={`${styles.content} prose`}>
        {turn.content.split('\n\n').map((para, i) => (
          <p key={i}>{para.replace(/^\n+/, '')}</p>
        ))}
      </div>

      {/* Round 1 extras */}
      {round === 1 && (
        <div className={styles.extras}>
          {actions.length > 0 && (
            <div className={styles.actions}>
              <p className={`${styles.extrasLabel} font-display`}>Recommended</p>
              <ol className={styles.actionsList}>
                {actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ol>
            </div>
          )}

          {turn.warning && (
            <div className={styles.warning}>
              <p className={`${styles.warningLabel} font-display`}>Warning</p>
              <p className={styles.warningText}>{turn.warning}</p>
            </div>
          )}
        </div>
      )}

      {/* Round 2 recommendation */}
      {round === 2 && actions.length > 0 && actions[0] && (
        <div className={styles.sharpened}>
          <p className={`${styles.sharpenedLabel} font-display`}>
            Sharpened Recommendation
          </p>
          <p className={styles.sharpenedText}>{actions[0]}</p>
        </div>
      )}
    </div>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className={styles.confidence} title={`Confidence: ${value}/10`}>
      <span className={`${styles.confidenceLabel} font-display`}>
        {value}/10
      </span>
      <div className={styles.confidenceBar}>
        <div
          className={styles.confidenceFill}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}
