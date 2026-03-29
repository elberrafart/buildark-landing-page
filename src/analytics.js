// Vercel Web Analytics integration
import { inject } from '@vercel/analytics';

// Inject the analytics script
inject({
  mode: 'auto',
  debug: false
});
