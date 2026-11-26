import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { systemClock } from './adapters/system-clock';
import { webIds } from './adapters/id';
import { browserStorage, createTaskStorage } from './adapters/local-storage';
import { StoreProvider } from './app/store';
import { Shell } from './ui/shell/Shell';
import { Today } from './ui/today/Today';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import './ui/theme.css';

/**
 * The one composition root for the browser runtime.
 *
 * Adapters are constructed here and nowhere else: `systemClock` is the only
 * `Date`-touching object in the app, `createTaskStorage` the only thing that
 * will ever hold a reference to `localStorage`, and `webIds` the only generator
 * of an identifier. Each surface receives what it needs rather than reaching
 * for a runtime of its own (AD-1, AD-2, AD-6). The Node harness has its own
 * root and supplies the Fixture's fixed reference date and its own fakes
 * through the same three ports, which is what makes the two agree by
 * construction.
 */
const container = document.querySelector('#root');

if (container === null) {
  // The mount point is part of the build, not part of the user's data. Its
  // absence is a broken artifact, and there is nothing a recovery panel could
  // offer — the boundary it would live in has nowhere to render.
  throw new Error('Mount point #root is missing from index.html.');
}

// Read once, and passed to both the chrome and the work area so the header's
// date and the reference date every list is computed against cannot disagree.
const today = systemClock.today();

// A `null` backing store is not an error path: it is the in-memory session that
// AC 5 requires, and the adapter answers for it the same way it answers for a
// refused write.
const taskStorage = createTaskStorage(browserStorage());

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <StoreProvider storage={taskStorage} ids={webIds}>
        <Shell today={today}>
          <Today today={today} />
        </Shell>
      </StoreProvider>
    </ErrorBoundary>
  </StrictMode>,
);
