'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/types';
import styles from './Header.module.css';

interface Props {
  user: AuthUser;
}

export default function Header({ user }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const navItems = [
    { href: '/dashboard', label: 'Chamber' },
    { href: '/dilemma/new', label: 'New Session' },
    { href: '/archive', label: 'Archive' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/dashboard" className={`${styles.wordmark} font-display`}>
          Small Council
        </Link>

        <nav className={styles.nav}>
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
  );
}
