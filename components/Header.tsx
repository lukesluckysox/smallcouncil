'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/types';
import styles from './Header.module.css';

interface Props {
  user: AuthUser;
}

const navItems = [
  { href: '/dashboard', label: 'Chamber' },
  { href: '/dilemma/new', label: 'New Session' },
  { href: '/archive', label: 'Archive' },
];

export default function Header({ user }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* ─── Desktop Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/dashboard" className={`${styles.wordmark} font-display`}>
            Small Council
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.userArea}>
            <span className={styles.userEmail}>{user.email}</span>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              aria-label="Sign out"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Nav ───────────────────────────────────────────────── */}
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavLink} ${pathname === item.href ? styles.mobileNavLinkActive : ''} font-display`}
          >
            {item.label}
          </Link>
        ))}
        <button onClick={handleLogout} className={`${styles.mobileNavLink} ${styles.mobileNavLeave} font-display`}>
          Leave
        </button>
      </nav>
    </>
  );
}
