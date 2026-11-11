import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AppLayout.module.scss';

// Add Projects and Dashboard here as those pages are built.
const NAV_ITEMS = [{ to: '/kit', label: 'UI kit' }];

export function AppLayout() {
  // Moves to uiSlice in Step 5; local state until the store exists.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Menu"
          aria-expanded={drawerOpen}
          aria-controls="app-sidebar"
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <span className={styles.brand}>TaskFlow</span>
      </header>

      <aside
        id="app-sidebar"
        className={[styles.sidebar, drawerOpen && styles.open].filter(Boolean).join(' ')}
      >
        <nav aria-label="Main">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    [styles.navLink, isActive && styles.active].filter(Boolean).join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {drawerOpen && <div className={styles.scrim} onClick={closeDrawer} aria-hidden="true" />}

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
