import { notFound } from 'next/navigation';
import { looks, clientById, lookById } from '@/lib/mock-data';
import { LookPageClient } from './LookPageClient';

type Props = {
  params: Promise<{ clientId: string; lookId: string }>;
};

export function generateStaticParams() {
  return looks.map((look) => ({
    clientId: look.clientId,
    lookId: look.id,
  }));
}

export const dynamicParams = false;

export default async function LookPage({ params }: Props) {
  const { clientId, lookId } = await params;
  const client = clientById(clientId);
  const look = lookById(lookId);

  if (!client || !look) {
    notFound();
  }

  return <LookPageClient client={client} look={look} />;
}
