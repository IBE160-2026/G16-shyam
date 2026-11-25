import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { systemClock } from './adapters/system-clock';
import { FirstRun } from './ui/first-run/FirstRun';
import { Shell } from './ui/shell/Shell';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import './ui/theme.css';

/**
 * The one composition root for the browser runtime.
 *
 * Adapters are constructed here and nowhere else: `systemClock` is the only
 * `Date`-touching object in the app, and the surface receives the day it is to
 * draw rather than reaching for a clock of its own (AD-2). The Node harness has
 * its own root and supplies the Fixture's fixed reference date through the same
 * port, which is what makes the two agree by construction.
 */
const container = document.querySelector('#root');

if (container === null) {
  // The mount point is part of the build, not part of the user's data. Its
  // absence is a broken artifact, and there is nothing a recovery panel could
  // offer — the boundary it would live in has nowhere to render.
  throw new Error('Mount point #root is missing from index.html.');
}

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <Shell today={systemClock.today()}>
        <FirstRun />
      </Shell>
    </ErrorBoundary>
  </StrictMode>,
);
