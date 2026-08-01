import { DEFAULT_READER_TEXT_SIZE, READER_TEXT_SIZES } from './constants';

export { DEFAULT_READER_TEXT_SIZE, READER_TEXT_SIZES } from './constants';

export type ReaderTextSize = (typeof READER_TEXT_SIZES)[number];

export interface ReaderTextStyle {
  '--reader-text-scale': number;
  '--reader-base-size': string;
  '--reader-sm-base-size'?: string;
}

export function getReaderTextScale(size: ReaderTextSize): number {
  return size / 100;
}

export function getNextReaderTextSize(size: ReaderTextSize, direction: -1 | 1): ReaderTextSize {
  const currentIndex = READER_TEXT_SIZES.indexOf(size);
  const nextIndex = Math.max(0, Math.min(READER_TEXT_SIZES.length - 1, currentIndex + direction));
  return READER_TEXT_SIZES[nextIndex];
}

export function getReaderTextSizeLabel(size: ReaderTextSize, language: 'simplified' | 'traditional'): string {
  const labels = language === 'traditional'
    ? ['較小', '標準', '舒適', '較大', '最大']
    : ['较小', '标准', '舒适', '较大', '最大'];
  return labels[READER_TEXT_SIZES.indexOf(size)];
}

export function getReaderTextStyle(
  size: ReaderTextSize,
  baseSize: string,
  smallBreakpointBaseSize?: string
): ReaderTextStyle {
  return {
    '--reader-text-scale': getReaderTextScale(size),
    '--reader-base-size': baseSize,
    ...(smallBreakpointBaseSize ? { '--reader-sm-base-size': smallBreakpointBaseSize } : {}),
  };
}
