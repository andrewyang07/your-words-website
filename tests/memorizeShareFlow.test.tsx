// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMORIZE_GUIDE_STORAGE_KEY, useMemorizeGuide } from '../components/memorize/MemorizeGuide';
import ReciteLinkList from '../components/memorize/ReciteLinkList';
import { VerseExercise, starterVerses } from '../components/memorize/MemorizePageClient';
import { CARD_HEIGHT, renderCompletionCard } from '../lib/memorize/completionCard';
import { buildMemorizationSession } from '../lib/memorize/session';
import { useAppStore } from '../stores/useAppStore';
import type { Verse } from '../types/verse';

const verse: Verse = {
  id: '约翰福音-3-16',
  book: '约翰福音',
  bookKey: '约翰福音',
  chapter: 3,
  verse: 16,
  text: '神爱世人，甚至将他的独生子赐给他们',
  testament: 'new',
};

beforeEach(() => {
  window.localStorage.clear();
  useAppStore.setState({ language: 'simplified' });
});
afterEach(() => cleanup());

describe('memorize guide pops automatically only once', () => {
  it('after the picker overview is closed, the first input stage does not pop it again', () => {
    function Harness({ surface }: { surface: 'picker' | 'input' }) {
      return <>{useMemorizeGuide(surface, 'simplified').dialog}</>;
    }
    const view = render(<Harness surface="picker" />);
    fireEvent.click(view.getByRole('button', { name: '知道了' }));
    view.rerender(<Harness surface="input" />);
    expect(view.queryByRole('button', { name: '知道了' })).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(MEMORIZE_GUIDE_STORAGE_KEY) ?? '{}')).toMatchObject({
      inputSeen: true,
    });
  });
});

describe('/memorize?p= shared link banner', () => {
  it('shows 朋友分享了 N 节经文 with one-click 收藏', () => {
    const onSaveAll = vi.fn();
    const view = render(
      <ReciteLinkList
        verses={[verse]}
        language="simplified"
        title={null}
        invalidCount={0}
        truncated={false}
        newerSchema={false}
        completedIds={new Set()}
        shared
        savedCount={0}
        onSaveAll={onSaveAll}
        onSelect={() => {}}
        onShare={() => {}}
      />,
    );
    expect(view.getByText('朋友分享了 1 节经文')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: '一键收藏' }));
    expect(onSaveAll).toHaveBeenCalledOnce();
  });

  it('shows 已全部收藏 when every verse is already saved', () => {
    const view = render(
      <ReciteLinkList
        verses={[verse]}
        language="traditional"
        title={null}
        invalidCount={0}
        truncated={false}
        newerSchema={false}
        completedIds={new Set()}
        shared
        savedCount={1}
        onSaveAll={() => {}}
        onSelect={() => {}}
        onShare={() => {}}
      />,
    );
    expect(view.getByText('朋友分享了 1 節經文')).toBeTruthy();
    expect((view.getByRole('button', { name: /已全部收藏/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('masked practice is hidden from assistive tech', () => {
  it('marks masked characters aria-hidden and announces how many are masked', () => {
    const session = buildMemorizationSession(verse.text, 'seed');
    const view = render(<VerseExercise session={session} stage={3} />);
    const hidden = view.container.querySelectorAll('.memorize-hidden');
    expect(hidden.length).toBeGreaterThan(0);
    hidden.forEach((el) => expect(el.getAttribute('aria-hidden')).toBe('true'));
    expect(view.container.querySelector('.sr-only')?.textContent).toContain(`已遮住 ${hidden.length} 个字`);
  });
});

describe('completion card layout', () => {
  it('centres a short verse vertically instead of leaving a large empty band', () => {
    const calls: Array<[string, number]> = [];
    const ctx = {
      fillStyle: '',
      font: '',
      textBaseline: '',
      textAlign: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: () => {},
      strokeRect: () => {},
      measureText: (v: string) => ({ width: v.length * 48 }),
      fillText: (text: string, _x: number, y: number) => calls.push([text, y]),
    };
    renderCompletionCard(ctx as never, {
      reference: '约翰福音 3:16',
      text: '神爱世人',
      date: '2026-10-11',
      title: null,
      brand: 'yourwords.me',
      doneLabel: '我背下来了 ✓',
    });
    const refY = calls.find(([t]) => t === '约翰福音 3:16')![1];
    expect(refY).toBeGreaterThan(CARD_HEIGHT * 0.3);
  });
});

describe('starter verses for an empty /memorize', () => {
  it('are inline (no Bible download) and follow the script', () => {
    expect(starterVerses('simplified').map((v) => v.id)).toEqual(['约翰福音-3-16', '诗篇-23-1', '腓立比书-4-13']);
    expect(starterVerses('traditional')[0]!.text).toContain('神愛世人');
    expect(starterVerses('traditional')[0]!.book).toBe('約翰福音');
  });
});
