import Link from 'next/link';
import { PERSONA_META, PERSONA_ORDER } from '@/lib/council/personas';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <span className={`${styles.wordmark} font-display`}>Small Council</span>
        <nav className={styles.nav}>
          <Link href="/login" className={styles.navLink}>Enter</Link>
          <Link href="/signup" className={`${styles.navLink} ${styles.navCta}`}>Begin</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={`${styles.heroPreamble} font-dramatic`}>
            The chamber convenes
          </p>
          <h1 className={`${styles.heroTitle} font-display`}>
            Bring Your Dilemma<br />Before the Council
          </h1>
          <p className={`${styles.heroSubtitle} font-dramatic`}>
            Five voices speak. Two rounds of debate. One moment of clarity.
          </p>
          <p className={styles.heroBody}>
            Small Council is a private chamber for hard decisions. You describe your
            dilemma. A council of five distinct advisors — each representing a
            different dimension of your inner life — responds, challenges one another,
            and helps you arrive at something true.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className={styles.ctaPrimary}>
              Convene the Council
            </Link>
            <Link href="/login" className={styles.ctaSecondary}>
              Return to your sessions
            </Link>
          </div>
        </div>
      </section>

      {/* Persona Preview */}
      <section className={styles.personaSection}>
        <div className="page-container">
          <div className="ornament" style={{ marginBottom: '48px' }}>
            <span className="font-display" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              The Council
            </span>
          </div>

          <div className={styles.personaGrid}>
            {PERSONA_ORDER.map((id) => {
              const meta = PERSONA_META[id];
              return (
                <div
                  key={id}
                  className={styles.personaCard}
                  style={{
                    '--persona-color': meta.accentColor,
                    '--persona-bg': `${meta.color}22`,
                    '--persona-border': `${meta.accentColor}44`,
                  } as React.CSSProperties}
                >
                  <div className={styles.personaName}>
                    <span className="font-display">{meta.name}</span>
                  </div>
                  <div className={styles.personaArchetype}>{meta.archetype}</div>
                  <p className={`${styles.personaDesc} font-dramatic`}>
                    {meta.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howSection}>
        <div className="page-container">
          <div className="ornament" style={{ marginBottom: '48px' }}>
            <span className="font-display" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              The Process
            </span>
          </div>

          <div className={styles.stepsGrid}>
            {[
              {
                num: 'I',
                title: 'State your dilemma',
                body: 'Describe what you are facing in your own words. There is no wrong format. The council hears everything.',
              },
              {
                num: 'II',
                title: 'The council speaks',
                body: 'Five advisors respond in parallel — each from a distinct vantage point. Desire, logic, pragmatism, shadow, wisdom.',
              },
              {
                num: 'III',
                title: 'The debate unfolds',
                body: 'In a second round, each voice challenges one other. The conflict surfaces what a single perspective would miss.',
              },
              {
                num: 'IV',
                title: 'Record your ruling',
                body: 'After the council speaks, you write your own reflection. Your conclusion. The archive holds it for you.',
              },
            ].map((step) => (
              <div key={step.num} className={styles.step}>
                <div className={`${styles.stepNum} font-display`}>{step.num}</div>
                <h3 className={`${styles.stepTitle} font-display`}>{step.title}</h3>
                <p className={`${styles.stepBody} font-dramatic`}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className={styles.footerCta}>
        <div className="page-container" style={{ textAlign: 'center' }}>
          <h2 className={`${styles.footerCtaTitle} font-display`}>
            The Council Awaits
          </h2>
          <p className={`${styles.footerCtaBody} font-dramatic`}>
            Your sessions are private. Your archive is yours alone.
          </p>
          <Link href="/signup" className={styles.ctaPrimary}>
            Begin Your First Session
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <span className="font-display" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Small Council
        </span>
      </footer>
    </main>
  );
}
