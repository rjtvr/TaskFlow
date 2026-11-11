import { useParams, useSearchParams } from 'react-router-dom';
import { Select } from '@/components/ui';

// Placeholder. The Kanban board is built in Step 6.4.
export default function BoardPage() {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';

  return (
    <>
      <h1>Board for project {projectId}</h1>
      <Select
        label="Filter by status"
        value={status}
        onChange={(e) =>
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              if (e.target.value) next.set('status', e.target.value);
              else next.delete('status');
              return next;
            },
            { replace: true },
          )
        }
      >
        <option value="">All</option>
        <option value="TODO">To do</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="REVIEW">Review</option>
        <option value="DONE">Done</option>
      </Select>
    </>
  );
}
