import { useState } from 'react';
import { Button } from '@/components/ui';

// Placeholder. Stats arrive in Step 6.6.
export default function DashboardPage() {
  const [crash, setCrash] = useState(false);
  // Temporary: lets you verify the error boundary. Remove with the placeholder.
  if (crash) throw new Error('Dashboard crashed on purpose');

  return (
    <>
      <h1>Dashboard</h1>
      <Button variant="danger" onClick={() => setCrash(true)}>
        Crash this page (boundary test)
      </Button>
    </>
  );
}
