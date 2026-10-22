// Styled wrappers over Radix DropdownMenu. Radix handles focus, typeahead and keyboard; we add the look.

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { IconCheck } from './icons.tsx';
import styles from './Menu.module.css';

export const MenuRoot = DropdownMenu.Root;
export const MenuTrigger = DropdownMenu.Trigger;

export function MenuContent({
  className,
  sideOffset = 4,
  align = 'end',
  ...props
}: ComponentProps<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        className={clsx(styles.content, className)}
        sideOffset={sideOffset}
        align={align}
        {...props}
      />
    </DropdownMenu.Portal>
  );
}

interface MenuItemProps extends ComponentProps<typeof DropdownMenu.Item> {
  danger?: boolean;
}

export function MenuItem({ className, danger = false, ...props }: MenuItemProps) {
  return (
    <DropdownMenu.Item
      className={clsx(styles.item, danger && styles.danger, className)}
      {...props}
    />
  );
}

export function MenuCheckboxItem({
  className,
  children,
  ...props
}: ComponentProps<typeof DropdownMenu.CheckboxItem>) {
  return (
    <DropdownMenu.CheckboxItem
      className={clsx(styles.item, styles.checkable, className)}
      {...props}
    >
      <span className={styles.check}>
        <DropdownMenu.ItemIndicator>
          <IconCheck width={14} height={14} />
        </DropdownMenu.ItemIndicator>
      </span>
      {children}
    </DropdownMenu.CheckboxItem>
  );
}

export function MenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenu.Label>) {
  return <DropdownMenu.Label className={clsx(styles.label, className)} {...props} />;
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className={styles.separator} />;
}
