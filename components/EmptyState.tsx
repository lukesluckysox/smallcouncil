import Link from 'next/link';
import styles from './EmptyState.module.css';

interface Props {
  title: string;
  body: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({ title, body, action }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.orb} />
      <h3 className={`${styles.title} font-display`}>{title}</h3>
      <p className={`${styles.body} font-dramatic`}>{body}</p>
      {action && (
        <Link href={action.href} className={`${styles.actionLink} font-display`}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
