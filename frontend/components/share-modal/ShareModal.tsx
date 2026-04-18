'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';
import { PillButton } from '@/components/shared/PillButton';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lookId: string;
  clientFirstName?: string;
};

export function ShareModal({
  open,
  onOpenChange,
  lookId,
  clientFirstName = 'Sarah',
}: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://phia.style/share/${lookId}`;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // ignore — demo
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-40 bg-bg-inverse/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="editorial-shadow fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-modal bg-bg-primary p-10"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-line-subtle text-ink-muted transition-colors hover:bg-bg-secondary hover:text-ink-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>

                <EyebrowLabel>Share with client</EyebrowLabel>
                <Dialog.Title asChild>
                  <h3 className="mt-3 font-display text-[32px] font-light leading-tight text-ink-primary">
                    Send this look to{' '}
                    <span className="display-italic">{clientFirstName}</span>.
                  </h3>
                </Dialog.Title>
                <Dialog.Description asChild>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    She&apos;ll see herself in the look with every piece priced
                    on Phia.
                  </p>
                </Dialog.Description>

                <div className="mt-6 flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 truncate rounded-full bg-bg-secondary px-5 py-3 font-mono text-sm text-ink-muted outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy link"
                    className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line-visible text-ink-primary transition-all duration-200 ease-editorial hover:bg-bg-secondary"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-accent-purple" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <span className="mt-2 block h-4 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-purple">
                  {copied ? 'Copied' : ''}
                </span>

                <div className="mt-6">
                  <PillButton
                    variant="accent"
                    size="lg"
                    href={`/share/${lookId}`}
                    className="w-full"
                  >
                    View as {clientFirstName}
                  </PillButton>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
