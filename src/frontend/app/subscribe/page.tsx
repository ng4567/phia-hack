export default function SubscribePage() {
  const tiers = [
    {
      name: 'Starter',
      price: '$19',
      cadence: '/month',
      description: 'Great for trying out premium styling tools.',
      features: ['1 active client', '10 AI try-ons per month', 'Email support'],
      cta: 'Choose Starter',
    },
    {
      name: 'Pro',
      price: '$49',
      cadence: '/month',
      description: 'Built for working stylists who need speed.',
      features: ['10 active clients', 'Unlimited AI try-ons', 'Priority support'],
      cta: 'Choose Pro',
      featured: true,
    },
    {
      name: 'Studio',
      price: '$99',
      cadence: '/month',
      description: 'For teams managing high-volume client workflows.',
      features: ['Unlimited clients', 'Team seats', 'Dedicated success manager'],
      cta: 'Choose Studio',
    },
  ];

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 24px 72px' }}>
      <section style={{ marginBottom: 36, textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-2)' }}>Pricing</p>
        <h1 style={{ margin: '12px auto 0', maxWidth: 760, fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          Pick the plan that fits your styling business.
        </h1>
        <p style={{ margin: '14px auto 0', maxWidth: 680, color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.55 }}>
          This is a static preview page. No account flow or billing logic is implemented.
        </p>
      </section>

      <section
        aria-label="Subscription plans"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}
      >
        {tiers.map((tier) => (
          <article
            key={tier.name}
            style={{
              background: 'var(--card)',
              border: `1px solid ${tier.featured ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: tier.featured ? '0 10px 32px rgba(0, 0, 0, 0.08)' : 'none',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 28 }}>{tier.name}</h2>
            <p style={{ margin: '10px 0 0', color: 'var(--ink-2)', fontSize: 16 }}>
              <span style={{ marginRight: 4, color: 'var(--ink)', fontSize: 40, lineHeight: 1, letterSpacing: '-0.02em' }}>{tier.price}</span>
              {tier.cadence}
            </p>
            <p style={{ minHeight: 44, margin: '12px 0 0', fontSize: 14, color: 'var(--ink-2)' }}>{tier.description}</p>
            <ul style={{ margin: '16px 0 0', paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--ink-2)', fontSize: 14 }}>
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              style={{
                marginTop: 'auto',
                border: `1px solid ${tier.featured ? 'var(--accent)' : 'var(--ink)'}`,
                borderRadius: 999,
                background: tier.featured ? 'var(--accent)' : 'var(--ink)',
                color: 'var(--paper)',
                fontSize: 14,
                fontWeight: 600,
                padding: '10px 14px',
                cursor: 'pointer',
              }}
            >
              {tier.cta}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
