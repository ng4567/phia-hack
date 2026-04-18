'use client';

import { use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { clientById, lookById, stylist } from '@/lib/mock-data';
import { LookbookShell } from '@/components/lookbook/LookbookShell';

type Params = { lookId: string };

export default function SharePage({ params }: { params: Promise<Params> }) {
  const { lookId } = use(params);
  const look = lookById(lookId);
  const client = look ? clientById(look.clientId) : undefined;

  useEffect(() => {
    if (client) {
      const first = client.name.split(' ')[0];
      document.title = `${first}'s Look · phia`;
    }
  }, [client]);

  if (!look || !client) {
    notFound();
  }

  return <LookbookShell look={look} client={client} stylist={stylist} />;
}
