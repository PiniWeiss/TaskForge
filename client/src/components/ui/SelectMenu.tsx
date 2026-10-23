// A compact labelled select on Radix Select: "Priority: High ▾".

import * as Select from '@radix-ui/react-select';
import clsx from 'clsx';
import { IconCheck, IconChevronDown } from './icons.tsx';
import styles from './SelectMenu.module.css';

interface SelectMenuProps<T extends string> {
  /** Visible prefix and accessible name: "Priority". */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SelectMenuProps<T>) {
  const current = options.find((o) => o.value === value);
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        const match = options.find((o) => o.value === next);
        if (match) onChange(match.value);
      }}
    >
      <Select.Trigger
        className={clsx(styles.trigger, className)}
        aria-label={`${label}: ${current?.label ?? ''}`}
      >
        <span className={styles.prefix}>{label}:</span>
        <Select.Value />
        <Select.Icon className={styles.chevron}>
          <IconChevronDown width={14} height={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={styles.content} position="popper" sideOffset={4} align="start">
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value} className={styles.item}>
                <span className={styles.check}>
                  <Select.ItemIndicator>
                    <IconCheck width={14} height={14} />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
