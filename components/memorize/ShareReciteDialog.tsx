'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Copy, Download, Share2, X } from 'lucide-react';
import QRCode from 'qrcode';
import type { Language } from '@/types/verse';

const dialogCopy = {
  simplified: {
    heading: '背诵链接', close: '关闭', urlLabel: '背诵链接网址', qrAlt: '背诵链接二维码',
    share: '分享', copy: '复制链接', saveQr: '保存二维码', copied: '链接已复制', manual: '请手动复制',
    defaultTitle: '背诵链接', shareText: (title: string) => `${title} · 一起背经文`,
  },
  traditional: {
    heading: '背誦連結', close: '關閉', urlLabel: '背誦連結網址', qrAlt: '背誦連結二維碼',
    share: '分享', copy: '複製連結', saveQr: '儲存二維碼', copied: '連結已複製', manual: '請手動複製',
    defaultTitle: '背誦連結', shareText: (title: string) => `${title} · 一起背經文`,
  },
} as const;

export default function ShareReciteDialog({
  open,
  onClose,
  url,
  title,
  language,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string | null;
  language: Language;
}) {
  const text = dialogCopy[language];
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus(null);
    QRCode.toDataURL(url, { errorCorrectionLevel: 'M', width: 240, margin: 1 })
      .then((dataUrl) => { if (!cancelled) setQrDataUrl(dataUrl); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [open, url]);

  const handleShare = async () => {
    const shareTitle = title ?? text.defaultTitle;
    try {
      await navigator.share({ title: shareTitle, text: text.shareText(shareTitle), url });
    } catch {
      // AbortError（用户取消）及其他失败都静默处理；复制按钮仍可用。
    }
  };

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(url);
      setStatus(text.copied);
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setStatus(text.manual);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[10010]">
      <div className="fixed inset-0 bg-stone-950/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="liquid-glass w-full max-w-sm rounded-3xl bg-white/95 p-6 text-stone-900 shadow-xl dark:bg-stone-950/95 dark:text-stone-100">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold">{title ?? text.heading}</DialogTitle>
            <button type="button" onClick={onClose} className="memorize-icon" aria-label={text.close}><X className="h-5 w-5" /></button>
          </div>
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={text.qrAlt} width={240} height={240} className="mx-auto mt-4 h-60 w-60 rounded-xl bg-white" />
          )}
          <label className="mt-4 block text-xs text-stone-500">
            {text.urlLabel}
            <input
              ref={inputRef}
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-1 w-full rounded-xl border border-stone-900/10 bg-white/70 px-3 py-2 text-sm text-stone-800 dark:border-white/10 dark:bg-white/[0.06] dark:text-stone-100"
            />
          </label>
          <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-amber-800 dark:text-amber-200">{status}</p>
          <div className="mt-3 grid gap-2">
            {canShare && (
              <button type="button" onClick={() => void handleShare()} className="memorize-primary"><Share2 className="h-4 w-4" />{text.share}</button>
            )}
            <button type="button" onClick={() => void handleCopy()} className="memorize-secondary"><Copy className="h-4 w-4" />{text.copy}</button>
            {qrDataUrl && (
              <a href={qrDataUrl} download="yourwords-qr.png" className="memorize-secondary"><Download className="h-4 w-4" />{text.saveQr}</a>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
