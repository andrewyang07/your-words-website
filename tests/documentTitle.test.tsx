// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import DocumentTitle from '../components/layout/DocumentTitle';
import { useAppStore } from '../stores/useAppStore';

beforeEach(() => {
  document.title = '關於你的話語 | 你的話語';
  useAppStore.setState({ language: 'traditional' });
});

afterEach(() => cleanup());

describe('DocumentTitle', () => {
  it('sets the tab title in the active script and follows language changes', () => {
    render(<DocumentTitle traditional="聖經筆記本" simplified="圣经笔记本" />);
    expect(document.title).toBe('聖經筆記本 | 你的話語');

    act(() => useAppStore.setState({ language: 'simplified' }));
    expect(document.title).toBe('圣经笔记本 | 你的话语');
  });

  it('re-applies the title when the framework swaps the metadata <title> back in', async () => {
    useAppStore.setState({ language: 'simplified' });
    render(<DocumentTitle traditional="聖經筆記本" simplified="圣经笔记本" />);

    await act(async () => {
      document.title = '聖經筆記本 | 你的話語'; // what Next's hoisted metadata <title> does after hydration
      await Promise.resolve();
    });

    expect(document.title).toBe('圣经笔记本 | 你的话语');
  });

  it('omits the brand suffix for absolute titles', () => {
    useAppStore.setState({ language: 'simplified' });
    render(<DocumentTitle absolute traditional="你的話語 - 首頁" simplified="你的话语 - 首页" />);
    expect(document.title).toBe('你的话语 - 首页');
  });
});
