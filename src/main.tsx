import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { systemClock } from './adapters/system-clock';
import { webIds } from './adapters/id';
import { browserStorage, createTaskStorage } from './adapters/local-storage';
import { StoreProvider } from './app/store';
import { useToday } from './app/use-today';
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

// A `null` backing store is not an error path: it is the in-memory session that
// AC 5 requires, and the adapter answers for it the same way it answers for a
// refused write.
const taskStorage = createTaskStorage(browserStorage());

/**
 * The composition: one reference date, handed to everything that needs one.
 *
 * It is a component rather than a module-scope `systemClock.today()` because
 * the value has to stay current. `today` is the date FR-23 resolves `Friday`
 * against and *persists* into `dueDate`, so a read taken once at page load
 * would, in a tab left open past local midnight, store a date a week off
 * (AD-2). `useToday` holds it in state and re-reads the port; everything below
 * still receives a plain string, so no surface and nothing on the capture path
 * reads a clock.
 *
 * Reading it once and passing it to the chrome, the store and the work area
 * alike is still the point: the header's date, the reference date the list is
 * computed against, and the date a capture parses against cannot disagree.
 *
 * The adapters are constructed outside, at module scope, so a re-render never
 * builds a second one — `storage` identity is what the store's reducer is
 * memoised on.
 */
function App() {
  const today = useToday(systemClock);

  return (
    <StoreProvider storage={taskStorage} ids={webIds} today={today}>
      <Shell today={today}>
        <Today today={today} />
      </Shell>
    </StoreProvider>
  );
}

createRoot(container).render(
  <StrictMode>
    {/*
      The boundary is outside `App` so it also stands under the composition
      itself, not only under the surfaces inside it (AD-20).
    */}
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
