import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Used by Jest (Step 9).
export const server = setupServer(...handlers);
