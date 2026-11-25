// Fixture for tests/unit/core-purity.test.ts — Story 1.1 AC 5.
//
// AC 5 is a statement about the lint rule, not about a module: `localdate.ts`
// alone cannot demonstrate it, because a module that never reaches for a banned
// global proves only that it did not. So each line below carrying a `ban:`
// marker reads exactly one entry on AD-1's ban list, and the test asserts that
// ESLint reports a restricted-* error on that line — and, in the other
// direction, that it reports one on no other line.
//
// Nothing imports this module. It is excluded from tsconfig.json and ignored by
// `eslint .` (the `to-do-list/core-purity-fixtures-ignored` config entry), so
// the only thing that ever lints it is the test, which lifts that one entry.
import React from 'react'; // ban: react
import { createRoot } from 'react-dom/client'; // ban: react-dom/client
import 'react/jsx-dev-runtime'; // ban: react/jsx-dev-runtime
import type { Clock } from '../../ports/clock'; // ban: deep layer import

export const viewportWidth = (): number => window.innerWidth; // ban: window
export const pageTitle = (): string => document.title; // ban: document
export const stored = (): string | null => localStorage.getItem('todo.tasks.v1'); // ban: localStorage
export const persisted = (): string | null => window.localStorage.getItem('todo.tasks.v1'); // ban: window.localStorage
export const load = (): Promise<Response> => fetch('/tasks'); // ban: fetch
export const platform = (): string => process.platform; // ban: process
export const userAgent = (): string => navigator.userAgent; // ban: navigator
export const elapsed = (): number => performance.now(); // ban: performance
export const identifier = (): string => crypto.randomUUID(); // ban: crypto
export const zone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone; // ban: Intl
export const pick = (): number => Math.random(); // ban: Math.random
export const mode = (): string => import.meta.env.MODE; // ban: import.meta
export const stamp = (): number => Date.now(); // ban: Date.now
export const rightNow = (): Date => new Date(); // ban: new Date

// The global object is the back door: each of these names a banned capability
// without naming a banned identifier, so the roots themselves are banned.
export const viaGlobal = (): string | null => globalThis.localStorage.getItem('x'); // ban: globalThis
export const viaSelf = (): Promise<Response> => self.fetch('/tasks'); // ban: self

export const session = (): string | null => sessionStorage.getItem('x'); // ban: sessionStorage
export const database = (): unknown => indexedDB.open('todo'); // ban: indexedDB
export const cache = (): Promise<Cache> => caches.open('shell'); // ban: caches
export const here = (): string => location.href; // ban: location
export const back = (): void => history.back(); // ban: history
export const request = (): unknown => new XMLHttpRequest(); // ban: XMLHttpRequest
export const socket = (): unknown => new WebSocket('wss://example.invalid'); // ban: WebSocket
export const nextFrame = (): number => requestAnimationFrame(() => undefined); // ban: requestAnimationFrame

// React and the Clock type are reachable here only because the imports above
// are what the rules catch; these lines carry no marker of their own.
export const element = (): unknown => React.createElement('div');
export const mount = (): unknown => createRoot;
export type AlsoBanned = Clock;
