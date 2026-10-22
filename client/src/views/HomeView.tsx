import styles from './HomeView.module.css';

export function HomeView() {
  return (
    <div className={styles.home}>
      <p className={styles.message}>Pick a project from the list to see its issues.</p>
    </div>
  );
}
