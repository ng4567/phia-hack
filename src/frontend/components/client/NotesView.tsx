// NotesView — Notes tab content. Style DNA + Loves + Avoid blocks with pill tags.
// Direct port of client.jsx:219–246.

import type { Client } from '@/lib/mock';

interface NotesViewProps {
  client: Client;
}

export function NotesView({ client }: NotesViewProps) {
  return (
    <div style={{ maxWidth: 720, padding: '12px 0' }}>
      <div className="note-block">
        <div className="micro">Style DNA</div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', marginTop: 8 }}>
          {client.notes}
        </div>
      </div>
      <div className="note-block" style={{ marginTop: 24 }}>
        <div className="micro">Loves</div>
        <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {['Toteme', 'Khaite', 'Reformation', 'The Row', 'Lemaire', 'Silk', 'Tailored', 'Neutrals'].map(t =>
            <span key={t} className="pill" style={{ cursor: 'default' }}>{t}</span>
          )}
        </div>
      </div>
      <div className="note-block" style={{ marginTop: 24 }}>
        <div className="micro">Avoid</div>
        <div className="row gap-6" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          {['Synthetics', 'Logo prints', 'Cropped tops'].map(t =>
            <span key={t} className="pill" style={{ cursor: 'default' }}>{t}</span>
          )}
        </div>
      </div>
    </div>
  );
}
