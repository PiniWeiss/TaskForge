import clsx from 'clsx';
import type { ButtonHTMLAttributes, Ref } from 'react';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Square, icon-only button. Requires an aria-label. */
  icon?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  icon = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(styles.button, styles[variant], icon && styles.icon, className)}
      {...props}
    />
  );
}
