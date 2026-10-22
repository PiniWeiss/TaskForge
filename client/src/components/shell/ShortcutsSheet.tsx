import * as Dialog from '@radix-ui/react-dialog';
import { IconClose } from '../ui/icons.tsx';
import { Kbd } from '../ui/Kbd.tsx';
import styles from './ShortcutsSheet.module.css';

const GROUPS = [
  {
    title: 'Issues',
    shortcuts: [
      { keys: ['J'], action: 'Next issue' },
      { keys: ['K'], action: 'Previous issue' },
      { keys: ['Enter'], action: 'Open the highlighted issue' },
      { keys: ['Esc'], action: 'Close the issue panel' },
      { keys: ['C'], action: 'New issue' },
    ],
  },
  {
    title: 'Everywhere',
    shortcuts: [
      { keys: ['/'], action: 'Search titles and numbers' },
      { keys: ['?'], action: 'Show this list' },
    ],
  },
  {
    title: 'While editing',
    shortcuts: [
      { keys: ['Enter'], action: 'Save the title or create the issue' },
      { keys: ['Esc'], action: 'Put back the saved text' },
      { keys: ['Tab'], action: 'Save and move to the next field' },
    ],
  },
] as const;

interface ShortcutsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsSheet({ open, onOpenChange }: ShortcutsSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.sheet}
          aria-describedby={undefined}
          // A reference sheet: start on the sheet itself, not on its close button.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
          }}
        >
          <div className={styles.head}>
            <Dialog.Title className={styles.title}>Keyboard shortcuts</Dialog.Title>
            <Dialog.Close className={styles.close} aria-label="Close">
              <IconClose />
            </Dialog.Close>
          </div>
          {GROUPS.map((group) => (
            <section key={group.title} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <dl className={styles.list}>
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.action} className={styles.row}>
                    <dt>{shortcut.action}</dt>
                    <dd>
                      {shortcut.keys.map((key) => (
                        <Kbd key={key} className={styles.key}>
                          {key}
                        </Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
