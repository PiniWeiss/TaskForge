import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import clsx from 'clsx';
import { useId } from 'react';
import styles from './Segmented.module.css';

interface SegmentedProps<T extends string> {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A single-choice control built on native radios: arrow keys, focus and form semantics for free. */
export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  const name = useId();
  return (
    <fieldset className={clsx(styles.group, className)}>
      <VisuallyHidden.Root asChild>
        <legend>{legend}</legend>
      </VisuallyHidden.Root>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => {
              onChange(option.value);
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
