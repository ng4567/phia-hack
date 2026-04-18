import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { clientById, lookById, stylist } from '@/lib/mock-data';
import { LookbookShell } from '@/components/lookbook/LookbookShell';

type Params = { lookId: string };

export function generateStaticParams() {
  return [lookById('look-sarah-01'), lookById('look-sarah-02'), lookById('look-sarah-03'), lookById('look-maya-01'), lookById('look-maya-02')]
    .filter((look): look is NonNullable<typeof look> => Boolean(look))
    .map((look) => ({ lookId: look.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lookId } = await params;
  const look = lookById(lookId);
  const client = look ? clientById(look.clientId) : undefined;

  if (!client) {
    return { title: 'Look · phia' };
  }

  const first = client.name.split(' ')[0];
  return { title: `${first}'s Look · phia` };
}

export default async function SharePage({ params }: { params: Promise<Params> }) {
  const { lookId } = await params;
  const look = lookById(lookId);
  const client = look ? clientById(look.clientId) : undefined;

  if (!look || !client) {
    notFound();
  }

  return <LookbookShell look={look} client={client} stylist={stylist} />;
}
