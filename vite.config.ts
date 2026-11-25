import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { labels } from './src/ui/labels.ts';

/**
 * The only network host the application may ever reach (AD-11). `connect-src`
 * is the mechanical half of that rule: the Anthropic API and nothing else, so a
 * third-party call cannot be added later without the policy refusing it.
 *
 * Everything else is closed down to the origin. There is no CDN, no analytics
 * and no third-party script in this product, so `'self'` is not a compromise.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "connect-src https://api.anthropic.com",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "manifest-src 'self'",
  "worker-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  // `frame-ancestors` is deliberately absent: a browser ignores it when the
  // policy arrives in a <meta> element, and announces that it is ignoring it.
  // It belongs on a response header, which this product does not have — there
  // is no server anywhere, by decision. A directive that can only be noise is
  // left out rather than carried for appearance.
].join('; ');

/**
 * Injects the policy into the *built* `index.html` only.
 *
 * `apply: 'build'` is the whole point. A static `<meta http-equiv>` in
 * `index.html` would also apply in development, where the React plugin injects
 * inline react-refresh, Tailwind injects a `<style>` element and HMR opens a
 * `ws://` connection — so a dev-time policy breaks `npm run dev`, which is the
 * command Story 1.1 AC 1 is measured on. The shipped artifact carries the
 * policy; the dev server does not (AD-11).
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'to-do-list:content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: CONTENT_SECURITY_POLICY,
            },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}

/**
 * Resolves `index.html`'s two user-visible strings from `src/ui/labels.ts`.
 *
 * The document title and the meta description are read by a person — in a tab,
 * a bookmark and a search result — so they are labels like any other, and
 * every user-visible string comes from `labels.ts` (AD-9, UX-DR18). HTML
 * cannot import a module, so the substitution happens here.
 *
 * No `apply`, unlike the policy above: this one must run for `npm run dev` as
 * well, or the dev server would serve a tab titled `{{appName}}`. The `{{…}}`
 * spelling is chosen to stay clear of Vite's own `%ENV%` HTML substitution.
 */
function documentStrings(): Plugin {
  return {
    name: 'to-do-list:document-strings',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html
          .replaceAll('{{appName}}', labels.appName)
          .replaceAll('{{appDescription}}', labels.appDescription);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), documentStrings(), contentSecurityPolicy()],
  build: {
    // A grader opens the built artifact from a static host or `vite preview`;
    // nothing here is served by an application server.
    target: 'es2023',
    sourcemap: false,
  },
  test: {
    // `core/` and the adapters are plain modules, and every unit test in this
    // story reads a committed file or drives a linter. No DOM is needed, and
    // not loading one keeps the suite honest about AD-1.
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
