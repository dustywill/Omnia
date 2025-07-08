/**
 * Application Header Component
 * 
 * Displays the Omnia logo and application branding
 */

// React import not needed with automatic JSX transform
import styles from './AppHeader.module.css';

export interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  return (
    <header className={`${styles.appHeader} ${className}`}>
      <div className={styles.logoContainer}>
        <img 
          src="./assets/omnia_logo.svg" 
          alt="Omnia Logo" 
          className={styles.logo}
        />
        <div className={styles.branding}>
          <h1 className={styles.title}>Omnia</h1>
          <p className={styles.subtitle}>Plugin-Based Development Platform</p>
        </div>
      </div>
    </header>
  );
}