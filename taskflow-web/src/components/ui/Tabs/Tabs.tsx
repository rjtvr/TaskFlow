import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import styles from './Tabs.module.scss';

interface TabsContextValue {
  value: string;
  select: (value: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<Tabs.${part}> must be rendered inside <Tabs>`);
  return ctx;
}

const tabId = (base: string, value: string) => `${base}-tab-${value}`;
const panelId = (base: string, value: string) => `${base}-panel-${value}`;

interface TabsProps {
  /** Controlled value. Pair with onValueChange. */
  value?: string;
  /** Initial value when uncontrolled. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

function TabsRoot({ value, defaultValue = '', onValueChange, children }: TabsProps) {
  const [inner, setInner] = useState(defaultValue);
  const baseId = useId();
  const current = value ?? inner;

  const select = useCallback(
    (next: string) => {
      if (value === undefined) setInner(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value: current, select, baseId }}>
      {children}
    </TabsContext.Provider>
  );
}

function List({ className, onKeyDown, ...rest }: HTMLAttributes<HTMLDivElement>) {
  // Arrow keys / Home / End move focus and selection (roving tabindex pattern).
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    const index = tabs.findIndex((t) => t === document.activeElement);
    if (index === -1) return;

    let next = -1;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next === -1) return;

    e.preventDefault();
    tabs[next]?.focus();
    tabs[next]?.click();
  };

  return (
    <div
      role="tablist"
      className={[styles.list, className].filter(Boolean).join(' ')}
      onKeyDown={handleKeyDown}
      {...rest}
    />
  );
}

interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
}

function Tab({ value, className, onClick, ...rest }: TabProps) {
  const ctx = useTabs('Tab');
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={tabId(ctx.baseId, value)}
      aria-selected={selected}
      aria-controls={panelId(ctx.baseId, value)}
      tabIndex={selected ? 0 : -1}
      className={[styles.tab, selected && styles.active, className].filter(Boolean).join(' ')}
      onClick={(e) => {
        onClick?.(e);
        ctx.select(value);
      }}
      {...rest}
    />
  );
}

interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  value: string;
}

function Panel({ value, className, children, ...rest }: PanelProps) {
  const ctx = useTabs('Panel');
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={panelId(ctx.baseId, value)}
      aria-labelledby={tabId(ctx.baseId, value)}
      tabIndex={0}
      className={[styles.panel, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}

export const Tabs = Object.assign(TabsRoot, { List, Tab, Panel });
