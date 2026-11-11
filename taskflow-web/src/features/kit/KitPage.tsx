import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  Modal,
  Select,
  Spinner,
  Tabs,
} from '@/components/ui';
import styles from './KitPage.module.scss';

type Theme = 'light' | 'dark';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <div className={styles.row}>{children}</div>
    </section>
  );
}

export default function KitPage() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.dataset.theme as Theme | undefined) ?? 'light',
  );
  const [modalOpen, setModalOpen] = useState(false);

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    setTheme(next);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>UI kit</h1>
        <Button variant="secondary" onClick={toggleTheme} aria-pressed={theme === 'dark'}>
          Theme: {theme}
        </Button>
      </header>

      <Section title="Button">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="ghost">Ghost</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </Section>

      <Section title="Input">
        <Input label="Default" placeholder="Type here" />
        <Input label="With hint" hint="We never share your email" />
        <Input label="With error" error="Title is required" defaultValue="" />
        <Input label="Disabled" disabled defaultValue="Can't edit" />
      </Section>

      <Section title="Select">
        <Select label="Status" defaultValue="TODO">
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="REVIEW">Review</option>
          <option value="DONE">Done</option>
        </Select>
        <Select label="With error" error="Pick a status">
          <option value="">Choose…</option>
          <option value="TODO">To do</option>
        </Select>
        <Select label="Disabled" disabled>
          <option>Locked</option>
        </Select>
      </Section>

      <Section title="Checkbox">
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="With error" error="You must accept" />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled checked" disabled defaultChecked />
      </Section>

      <Section title="Badge">
        <Badge>Neutral</Badge>
        <Badge tone="primary">Primary</Badge>
        <Badge tone="success">Success</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="danger">Danger</Badge>
      </Section>

      <Section title="Spinner">
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </Section>

      <Section title="Card">
        <Card title="Plain card">Body content only after the title.</Card>
        <Card title="With footer" footer={<Button size="sm">Action</Button>}>
          Card with a footer slot.
        </Card>
        <Card>No title.</Card>
      </Section>

      <Section title="EmptyState">
        <EmptyState title="No projects match" />
        <EmptyState
          title="Could not load projects"
          message="The server returned an error."
          action={<Button>Retry</Button>}
        />
      </Section>

      <Section title="Tabs">
        <div className={styles.full}>
          <Tabs defaultValue="overview">
            <Tabs.List aria-label="Project sections">
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="activity">Activity</Tabs.Tab>
              <Tabs.Tab value="settings" disabled>
                Settings (disabled)
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="overview">Overview panel. Use arrow keys on the tabs.</Tabs.Panel>
            <Tabs.Panel value="activity">Activity panel.</Tabs.Panel>
          </Tabs>
        </div>
      </Section>

      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)}>Open modal</Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
          <p>Press Escape or click outside to close. Focus returns to the trigger.</p>
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </Modal>
      </Section>
    </div>
  );
}
