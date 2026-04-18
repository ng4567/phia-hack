// Quote — testimonial figure for the public stylist portfolio.
// Ported from portfolio.jsx lines 156–166.

export interface QuoteProps {
  text: string;
  author: string;
  role: string;
}

export function Quote({ text, author, role }: QuoteProps) {
  return (
    <figure style={{ margin: 0 }}>
      <div
        className="serif-italic"
        style={{ fontSize: 22, lineHeight: 1.4, color: 'var(--ink)', letterSpacing: '-0.01em' }}
      >
        &ldquo;{text}&rdquo;
      </div>
      <figcaption style={{ marginTop: 18, fontSize: 12.5 }}>
        <div style={{ color: 'var(--ink)' }}>{author}</div>
        <div className="micro" style={{ marginTop: 3 }}>{role}</div>
      </figcaption>
    </figure>
  );
}
