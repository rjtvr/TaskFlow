import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui';

// Placeholder. Shows list state living in the URL (?q=...) so it survives a
// refresh and can be shared. Real data and pagination come in Step 6.3.
export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const setQuery = (value: string) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('q', value);
        else next.delete('q');
        return next;
      },
      { replace: true }, // typing should not fill the history stack
    );

  return (
    <>
      <h1>Projects</h1>
      <Input label="Search projects" value={q} onChange={(e) => setQuery(e.target.value)} />
      <p>
        <Link to="/projects/1/board">Open project 1 board</Link>
      </p>
    </>
  );
}
