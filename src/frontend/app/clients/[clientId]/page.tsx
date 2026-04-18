import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/shared/AppShell';
import { EyebrowLabel } from '@/components/shared/EyebrowLabel';
import { clients, clientById } from '@/lib/mock-data';
import { formatDaysAgo } from '@/lib/utils';

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export function generateStaticParams() {
  return clients.map((client) => ({ clientId: client.id }));
}

export const dynamicParams = false;

export default async function ClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = clientById(clientId);

  if (!client) {
    notFound();
  }

  const firstName = client.name.split(/\s+/)[0];
  const sortedLooks = client.looks
    .slice()
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <AppShell>
      <main className="mx-auto max-w-[1400px] px-10 py-12">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted transition-colors duration-200 ease-editorial hover:text-ink"
        >
          <span aria-hidden>&larr;</span>
          <span>BACK TO CLIENTS</span>
        </Link>

        <div className="mt-10 grid grid-cols-[minmax(0,400px)_1fr] gap-16">
          <aside className="sticky top-24 self-start">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border border-line-subtle bg-bg-secondary">
              <Image
                src={client.photoUrl}
                alt={client.name}
                fill
                sizes="400px"
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="mt-8 rounded-md border border-line-subtle p-6">
              <EyebrowLabel>SIZING</EyebrowLabel>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <SizingCell label="TOP" value={client.sizing.top} />
                <SizingCell label="BOTTOM" value={client.sizing.bottom} />
                <SizingCell label="SHOE" value={client.sizing.shoe} />
              </div>
            </div>

            <div className="mt-6">
              <EyebrowLabel>NOTES</EyebrowLabel>
              <blockquote className="mt-3 font-display text-xl font-light italic leading-relaxed text-ink">
                &ldquo;{client.notes}&rdquo;
              </blockquote>
            </div>
          </aside>

          <section>
            <EyebrowLabel>
              LOOKS &middot; {client.looks.length} STYLED
            </EyebrowLabel>
            <h2 className="mt-6 font-display text-7xl-display font-light text-ink">
              {firstName}&rsquo;s <em className="display-italic">closet</em>
            </h2>

            <div className="mt-12 grid grid-cols-2 gap-6">
              {sortedLooks.map((look) => {
                const coverImage =
                  look.tryOnImageUrl && !look.tryOnImageUrl.startsWith('/tryons/')
                    ? look.tryOnImageUrl
                    : look.garments[0]?.imageUrl;

                return (
                  <Link
                    key={look.id}
                    href={`/clients/${client.id}/looks/${look.id}`}
                    className="group block overflow-hidden rounded-md border border-line-subtle bg-bg-primary transition-all duration-300 ease-editorial hover:-translate-y-1 editorial-shadow"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-bg-tertiary to-bg-secondary">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={look.occasion ?? 'Styled look'}
                          fill
                          sizes="(min-width: 1024px) 30vw, 50vw"
                          className="object-cover transition-transform duration-500 ease-editorial group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-display text-5xl font-light italic text-ink-disabled">
                            ready
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-light italic text-ink">
                        {look.occasion ?? 'Untitled look'}
                      </h3>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                        {formatDaysAgo(look.createdAt)} &middot;{' '}
                        {look.garments.length} pieces
                      </p>
                    </div>
                  </Link>
                );
              })}

              <Link
                href={`/clients/${client.id}/looks/new`}
                className="group flex aspect-[4/5] flex-col items-center justify-center gap-4 rounded-md border border-dashed border-line-visible bg-bg-secondary p-6 transition-colors duration-200 ease-editorial hover:bg-bg-tertiary"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line-visible bg-bg-primary text-ink-muted transition-transform duration-300 ease-editorial group-hover:-translate-y-0.5">
                  <Plus className="h-5 w-5" strokeWidth={1.25} />
                </div>
                <h3 className="font-display text-2xl font-light italic text-ink">
                  Style a new look
                </h3>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  START FROM EMPTY
                </p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function SizingCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
      <p className="mt-1 font-display text-2xl font-light text-ink">{value}</p>
    </div>
  );
}
