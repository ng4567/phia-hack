import { notFound } from 'next/navigation';
import { clients, clientById } from '@/lib/mock-data';
import { NewLookPageClient } from './NewLookPageClient';

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export function generateStaticParams() {
  return clients.map((client) => ({ clientId: client.id }));
}

export const dynamicParams = false;

export default async function NewLookPage({ params }: PageProps) {
  const { clientId } = await params;
  const client = clientById(clientId);

  if (!client) {
    notFound();
  }

  return <NewLookPageClient clientId={clientId} />;
}
