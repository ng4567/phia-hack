'use client';

// ShareModal — share-with-client modal with copy-link + Email/SMS/Preview.
// Direct port of result.jsx:206–236 with one Wave 2 side-effect: when
// the stylist confirms a share (Email, SMS, or Preview — any of the
// three primary CTAs), we post a `kind: 'look-share'` message into the
// chat thread so the client app's chat page immediately surfaces it.
// The modal's visual UX is untouched; the post is a fire-and-forget
// side effect.

import { useCallback, useState } from 'react';
import type { Client } from '@/lib/mock';
import { getLook } from '@/lib/mock';
import { MOCK } from '@/lib/mock';
import { useChatStore, threadIdFor } from '@/lib/chatStore';
import { Icon } from '@/components/Icon';

export interface ShareModalProps {
  client: Client;
  lookId: string;
  onClose: () => void;
  onPreview: () => void;
}

export function ShareModal({
  client,
  lookId,
  onClose,
  onPreview,
}: ShareModalProps) {
  const link = `phia.com/s/${lookId}`;
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Single side-effect: post a look-share chat message on confirm.
  // Guards against double-posting if the stylist clicks multiple of
  // Email / SMS / Preview in the same modal session.
  const postLookShare = useCallback(() => {
    if (shared) return;
    const look = getLook(lookId);
    const body = look?.occasion ?? 'New look for you';
    useChatStore.getState().postMessage({
      threadId: threadIdFor(client.id, MOCK.stylist.handle),
      sender: 'stylist',
      kind: 'look-share',
      body,
      lookId,
    });
    setShared(true);
  }, [client.id, lookId, shared]);

  const handleEmail = useCallback(() => {
    postLookShare();
    onClose();
  }, [postLookShare, onClose]);

  const handleSms = useCallback(() => {
    postLookShare();
    onClose();
  }, [postLookShare, onClose]);

  const handlePreview = useCallback(() => {
    postLookShare();
    onPreview();
  }, [postLookShare, onPreview]);

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <Icon.close />
        </button>
        <div
          className="serif-italic"
          style={{ fontSize: 36, lineHeight: 1.1 }}
        >
          Share with {client.name.split(' ')[0]}
        </div>
        <p style={{ marginTop: 10, color: 'var(--ink-2)', fontSize: 14 }}>
          She&apos;ll see the full look on her body with every piece priced by phia.
        </p>
        <div className="share-link">
          <Icon.link />
          <span style={{ flex: 1, fontSize: 13 }}>{link}</span>
          <button
            className="btn btn-ghost"
            onClick={() => {
              navigator.clipboard?.writeText(link);
              setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="row gap-12" style={{ marginTop: 18 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={handleEmail}
          >
            Email
          </button>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={handleSms}
          >
            SMS
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handlePreview}
          >
            Preview
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-back {
          position: fixed;
          inset: 0;
          background: rgba(26, 24, 22, 0.35);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 120;
          animation: fadeUp 0.2s ease;
        }
        .modal {
          background: var(--card);
          border-radius: var(--radius-lg);
          padding: 32px;
          width: 460px;
          position: relative;
          box-shadow: var(--shadow-lg);
        }
        .modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: var(--ink-3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover {
          background: var(--bg);
          color: var(--ink);
        }
        .share-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg);
          border-radius: 999px;
          margin-top: 20px;
          color: var(--ink-2);
        }
      `}</style>
    </div>
  );
}
