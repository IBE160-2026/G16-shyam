import { Component, Fragment, type ReactNode } from 'react';
import { labels } from '../labels';

/**
 * The app never shows the grader a blank page (AD-20).
 *
 * The "no error state, ever" rule and the no-logging rule combine to produce
 * exactly one failure mode: an uncaught render error becoming a white screen on
 * a machine with no console open and no telemetry to report it. This is the
 * floor under that — a plain recovery panel offering a way back, with the task
 * document untouched on disk. Never a stack trace, never a blank document.
 *
 * It catches and renders; it does not log. Nothing in the shipped app logs
 * (AD-11), and a crash reporter would be the first third party in a product
 * whose whole claim is that there are none.
 *
 * Story 1.4 wraps each routed surface in its own boundary, so a crash in one
 * destination leaves the others reachable. Here there is one surface, so there
 * is one boundary.
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
  /** Bumped on recovery, and used as the subtree's key. */
  attempt: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false, attempt: 0 };

  static getDerivedStateFromError(): Pick<ErrorBoundaryState, 'failed'> {
    return { failed: true };
  }

  // There is deliberately no `componentDidCatch`. `getDerivedStateFromError`
  // alone makes this a boundary; the only thing the second hook adds is a place
  // to read the error and its component stack, and there is nowhere for those to
  // go that is not logging (AD-11).

  private readonly recover = (): void => {
    // The attempt counter is the subtree's key, so recovering **rebuilds** the
    // surface rather than resuming it. Clearing the flag alone would re-render
    // the same mounted components with the same state that just threw, and a
    // deterministic error would throw again before the user saw anything — the
    // recovery panel would flicker and come straight back, which is a blank
    // page with extra steps (AD-20).
    this.setState((previous) => ({ failed: false, attempt: previous.attempt + 1 }));
  };

  override render(): ReactNode {
    if (!this.state.failed) {
      return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
    }

    return (
      <div className="flex min-h-screen flex-col items-start justify-center gap-group-gap-max bg-ground px-gutter-mobile xl:px-gutter-desktop">
        <h1 className="font-family-apparatus font-apparatus text-title uppercase tracking-apparatus-max text-ink">
          {labels.recovery.heading}
        </h1>
        <p className="max-w-[320px] font-family-body font-body text-body leading-[17px] text-ink-secondary">
          {labels.recovery.body}
        </p>
        <button
          type="button"
          onClick={this.recover}
          className="h-button-height-max min-w-[120px] cursor-pointer border border-ink bg-surface px-group-gap-min font-family-apparatus font-apparatus text-apparatus uppercase tracking-apparatus-min text-ink outline-offset-2 outline-ink focus-visible:outline-2"
        >
          {labels.recovery.action}
        </button>
      </div>
    );
  }
}
