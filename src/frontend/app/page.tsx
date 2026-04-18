import { AppShell } from '@/components/shared/AppShell';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';
import { ClientCard } from '@/components/dashboard/ClientCard';
import { clients } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[1400px] px-10 py-16">
        <section>
          <EyebrowLabel>
            TODAY&rsquo;S CLIENTS &middot; {clients.length} ACTIVE
          </EyebrowLabel>
          <h1 className="mt-6 font-display text-8xl-display font-light text-ink">
            Who&rsquo;s getting styled{' '}
            <em className="display-italic">today?</em>
          </h1>
          <p className="mt-6 max-w-xl font-sans text-lg text-ink-muted">
            Two clients waiting on looks. Pick one to start building, or review
            what you&rsquo;ve already styled.
          </p>
        </section>

        <section className="mt-48">
          <div className="flex items-center gap-6">
            <EyebrowLabel>CLIENTS</EyebrowLabel>
            <div className="h-px flex-1 bg-line-visible" />
          </div>

          <div className="mt-10 grid grid-cols-2 gap-8">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}

            <article className="flex aspect-[3/4] flex-col items-start justify-end rounded-md border border-dashed border-line-visible bg-bg-secondary/60 p-8">
              <EyebrowLabel>NEW CLIENT</EyebrowLabel>
              <h3 className="mt-3 font-display text-3xl font-light leading-tight text-ink-muted">
                Add someone to your <em className="display-italic">roster.</em>
              </h3>
              <p className="mt-3 font-sans text-sm text-ink-disabled">
                Intake forms coming soon.
              </p>
            </article>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
