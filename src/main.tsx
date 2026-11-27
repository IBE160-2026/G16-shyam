import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { systemClock } from './adapters/system-clock';
import { webIds } from './adapters/id';
import { browserStorage, createTaskStorage } from './adapters/local-storage';
import { StoreProvider, useTasks } from './app/store';
import { TODAY_ROUTE, useRoute, type Route } from './app/router';
import { useToday } from './app/use-today';
import type { LocalDate } from './core/localdate';
import type { Task } from './core/task';
import { Shell } from './ui/shell/Shell';
import { Today } from './ui/today/Today';
import { TaskDetail } from './ui/task-detail/TaskDetail';
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
  const route = useRoute();

  return (
    <StoreProvider storage={taskStorage} ids={webIds} today={today}>
      <RoutedSurface route={route} today={today} />
    </StoreProvider>
  );
}

/**
 * The route, resolved against the document, and rendered inside the shell
 * (AC 3, AC 4, AD-16, AD-20).
 *
 * **It is inside the provider because resolving a route needs the document.**
 * `#/task/<id>` names a Task that may not exist — a link kept after the Task
 * was deleted, a hand-typed id, a document restored from another device. The
 * hash alone cannot say; only the store can. So the lookup happens here, and an
 * id that matches nothing falls back to Today: no empty detail surface, no
 * error panel, nothing thrown. A wrong address is not a failure to report
 * (UX-DR21).
 *
 * The address bar is left exactly as the user asked for it in that case. The
 * app has nothing truer to replace it with, and rewriting it would erase the
 * evidence of what was actually requested — while the *shell* follows the
 * surface on screen rather than the hash, so the chrome never claims to be
 * somewhere the work area is not.
 *
 * **One boundary per routed surface, keyed by route** (AD-20). The key is what
 * makes recovery per-surface rather than per-session: without it React would
 * keep the same boundary instance across a navigation, so a surface that threw
 * would leave its recovery panel standing over the *next* surface, which had
 * done nothing wrong. With it, arriving somewhere new mounts a boundary that
 * has not failed.
 */
function RoutedSurface({ route, today }: { route: Route; today: LocalDate }) {
  const tasks = useTasks();
  const task = findRoutedTask(route, tasks);

  return (
    <Shell today={today} route={task === null ? TODAY_ROUTE : route}>
      {task === null ? (
        <ErrorBoundary key="today">
          <Today today={today} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary key={`task/${task.id}`}>
          <TaskDetail task={task} />
        </ErrorBoundary>
      )}
    </Shell>
  );
}

/**
 * The Task a task route addresses, or `null` for every other route and for an
 * id no Task carries.
 *
 * An archived Task is *not* excluded. Archive decides what a **list** contains
 * (FR-2); it does not make a Task unaddressable, and a link to one that
 * answered with Today would be a surface disappearing on a date rather than on
 * anything the user did. Epic 3's Archive is where they are listed again.
 */
function findRoutedTask(route: Route, tasks: readonly Task[]): Task | null {
  if (route.kind !== 'task') return null;
  return tasks.find((task) => task.id === route.id) ?? null;
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
