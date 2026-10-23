import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { THEME_PREFERENCES, useTheme, type ThemePreference } from '../../theme/theme.tsx';
import styles from './ThemeToggle.module.css';

const LABELS: Record<ThemePreference, string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

/** Native radios, so arrow keys and form semantics come for free. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className={styles.toggle}>
      <VisuallyHidden.Root asChild>
        <legend>Theme</legend>
      </VisuallyHidden.Root>
      {THEME_PREFERENCES.map((option) => (
        <label key={option} className={styles.option}>
          <input
            type="radio"
            name="theme"
            value={option}
            checked={preference === option}
            onChange={() => {
              setPreference(option);
            }}
          />
          {LABELS[option]}
        </label>
      ))}
    </fieldset>
  );
}
