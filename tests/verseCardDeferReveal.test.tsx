// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EAGER_REVEAL_COUNT } from '../components/verses/MasonryLayout';
import VerseCard from '../components/verses/VerseCard';
import type { Verse } from '../types/verse';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const verse = {
  id: '约翰福音-3-16',
  book: '约翰福音',
  bookKey: '约翰福音',
  chapter: 3,
  verse: 16,
  text: '神爱世人，甚至将他的独生子赐给他们。',
  testament: 'new',
} as unknown as Verse;

let observers: { cb: IntersectionObserverCallback; disconnected: boolean }[] = [];
beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      entry: { cb: IntersectionObserverCallback; disconnected: boolean };
      constructor(cb: IntersectionObserverCallback) {
        this.entry = { cb, disconnected: false };
        observers.push(this.entry);
      }
      observe() {}
      disconnect() {
        this.entry.disconnected = true;
      }
    },
  );
});
const scrollNear = () =>
  act(() => {
    observers
      .filter((o) => !o.disconnected)
      .forEach((o) => o.cb([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const card = () => screen.getByRole('article');

describe('VerseCard deferred reveal (home TBT)', () => {
  it('only the first few cards render full text eagerly', () => {
    expect(EAGER_REVEAL_COUNT).toBeGreaterThanOrEqual(4);
    expect(EAGER_REVEAL_COUNT).toBeLessThanOrEqual(12);
  });

  it('eager card shows full text on first render', () => {
    render(<VerseCard verse={verse} defaultRevealed />);
    expect(card().textContent).toContain('神爱世人，甚至');
  });

  it('deferred card mounts masked with the same length, then reveals once near the viewport', () => {
    vi.useFakeTimers();
    render(<VerseCard verse={verse} defaultRevealed deferReveal />);
    const masked = card().querySelector('p')!.textContent;
    expect(masked).not.toBe(verse.text);
    expect([...masked].length).toBe([...verse.text].length); // same glyph count → no height change
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(card().querySelector('p')!.textContent).toBe(masked); // nothing happens off-screen
    scrollNear();
    expect(card().querySelector('p')!.textContent).toBe(verse.text);
  });

  it('a later 背诵 toggle still masks deferred cards, and a user tap is not overridden', () => {
    const view = render(<VerseCard verse={verse} defaultRevealed deferReveal />);
    scrollNear();
    view.rerender(<VerseCard verse={verse} defaultRevealed={false} deferReveal />);
    expect(card().getAttribute('aria-label')).toContain('已收起');
    fireEvent.click(card());
    scrollNear();
    expect(card().getAttribute('aria-label')).toContain('已展开');
  });
});
