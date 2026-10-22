import * as Select from '@radix-ui/react-select';
import type { ReactNode } from 'react';
import { IconCheck, IconChevronDown } from '../ui/icons.tsx';
import styles from './PropertySelect.module.css';

interface PropertySelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  render: (value: T) => ReactNode;
  /** Plain-text name of a value, for the trigger's accessible name: "Status: In progress". */
  describe: (value: T) => string;
  onChange: (value: T) => void;
}

/** A property value that opens into a list: the trigger shows the value exactly as the table does. */
export function PropertySelect<T extends string>({
  label,
  value,
  options,
  render,
  describe,
  onChange,
}: PropertySelectProps<T>) {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        const match = options.find((o) => o === next);
        if (match && match !== value) onChange(match);
      }}
    >
      <Select.Trigger className={styles.trigger} aria-label={`${label}: ${describe(value)}`}>
        <Select.Value>{render(value)}</Select.Value>
        <Select.Icon className={styles.chevron}>
          <IconChevronDown width={14} height={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={styles.content} position="popper" sideOffset={4} align="start">
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item key={option} value={option} className={styles.item}>
                <Select.ItemText>{render(option)}</Select.ItemText>
                <Select.ItemIndicator className={styles.check}>
                  <IconCheck width={14} height={14} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
