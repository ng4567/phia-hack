// ClosetEmpty — empty-state view for the Closet tab.
// Direct port of client.jsx:209–217.

export function ClosetEmpty() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ink-3)' }}>
      <div className="serif-italic" style={{ fontSize: 32, color: 'var(--ink-2)' }}>Sarah hasn&apos;t uploaded her closet yet.</div>
      <div style={{ marginTop: 10, fontSize: 14 }}>Invite her to scan her pieces — she&apos;ll see pairing suggestions from every look.</div>
      <button className="btn btn-ghost" style={{ marginTop: 24 }}>Send closet invite</button>
    </div>
  );
}
