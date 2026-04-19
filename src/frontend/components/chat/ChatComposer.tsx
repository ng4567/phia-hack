'use client';

// ChatComposer — the input + send control at the bottom of a chat view.
//
// - Controlled input; Enter to send, Shift+Enter for newline.
// - Disabled when the input is empty or only whitespace.
// - One quick action pill above the input: ✨ "Dress me for my upcoming events."
//   (the exact agent trigger phrase). Tapping it prefills the input rather
//   than auto-sending — the user confirms the send themselves.
// - Optional `prefill` prop seeds the input on mount.

import { useEffect, useRef, useState } from 'react';

import { useChatStore } from '@/lib/chatStore';
import type { ChatMessageSender } from '@/lib/mock/types';

const AGENT_TRIGGER_PHRASE = 'Dress me for my upcoming events.';

export interface ChatComposerProps {
  threadId: string;
  sender: ChatMessageSender;
  /** Initial value for the input (e.g. to seed from a query param). */
  prefill?: string;
  /** Placeholder copy shown when the input is empty. */
  placeholder?: string;
  /** Invoked right after a successful send. */
  onSent?: () => void;
}

export function ChatComposer({
  threadId,
  sender,
  prefill,
  placeholder = 'Message your stylist…',
  onSent,
}: ChatComposerProps) {
  const [value, setValue] = useState<string>(prefill ?? '');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const postMessage = useChatStore((s) => s.postMessage);

  useEffect(() => {
    if (prefill !== undefined) {
      setValue(prefill);
    }
  }, [prefill]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0;

  const send = () => {
    if (!canSend) return;
    postMessage({
      threadId,
      sender,
      kind: 'text',
      body: trimmed,
    });
    setValue('');
    onSent?.();
    // Reset height after send
    const ta = textareaRef.current;
    if (ta) ta.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleQuickAction = () => {
    setValue(AGENT_TRIGGER_PHRASE);
    // Focus the input so the user can extend or send immediately.
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Auto-resize the textarea up to a cap.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  };

  const placeholderForSender =
    sender === 'client' ? placeholder : 'Reply to your client…';

  return (
    <div className="composer">
      {sender === 'client' && (
        <div className="quick-row">
          <button
            type="button"
            className="quick-pill"
            onClick={handleQuickAction}
            aria-label="Use quick prompt: Dress me for my upcoming events."
          >
            <span className="sparkle" aria-hidden="true">✨</span>
            <span>Dress me for my upcoming events.</span>
          </button>
        </div>
      )}

      <div className={`input-row ${canSend ? 'ready' : ''}`}>
        <textarea
          ref={textareaRef}
          className="input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderForSender}
          rows={1}
          aria-label="Message input"
        />
        <button
          type="button"
          className="send"
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1.5 7L12.5 1.5L9.5 12.5L7 8L1.5 7Z"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .composer {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 16px 16px;
          border-top: 1px solid var(--line);
          background: var(--card);
        }

        .quick-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .quick-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 999px;
          background: var(--accent-soft);
          border: 1px solid rgba(217,119,87,0.2);
          color: var(--ink);
          font-size: 12px;
          font-weight: 500;
          transition:
            transform .2s cubic-bezier(.2,.7,.2,1),
            background .2s ease,
            border-color .2s ease;
        }
        .quick-pill:hover {
          background: #F1D9C6;
          border-color: rgba(217,119,87,0.4);
          transform: translateY(-1px);
        }
        .quick-pill:active { transform: translateY(0); }
        .sparkle { font-size: 12px; }

        .input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 8px 8px 8px 14px;
          border: 1px solid var(--line);
          border-radius: 18px;
          background: var(--bg);
          transition: border-color .2s ease, background .2s ease;
        }
        .input-row:focus-within {
          border-color: var(--line-2);
          background: var(--card);
        }
        .input-row.ready {
          border-color: rgba(26,24,22,0.16);
        }

        .input {
          flex: 1 1 auto;
          border: none;
          outline: none;
          background: transparent;
          resize: none;
          font-size: 13.5px;
          line-height: 1.45;
          color: var(--ink);
          min-height: 20px;
          max-height: 160px;
          padding: 4px 0;
          font-family: inherit;
        }
        .input::placeholder { color: var(--ink-4); }

        .send {
          width: 34px; height: 34px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center; justify-content: center;
          background: var(--ink);
          color: var(--card);
          transition: transform .2s cubic-bezier(.2,.7,.2,1),
                      background .2s ease, opacity .2s ease;
          flex-shrink: 0;
        }
        .send:hover:not(:disabled) {
          background: #000;
          transform: translate(1px, -1px);
        }
        .send:active:not(:disabled) { transform: scale(.96); }
        .send:disabled {
          background: var(--ink-4);
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
