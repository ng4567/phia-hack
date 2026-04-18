'use client';

import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { AppShell } from '@/components/shared/AppShell';
import { LookResult } from '@/components/try-on/LookResult';
import { TryOnLoader } from '@/components/try-on/TryOnLoader';
import { clientById, lookById } from '@/lib/mock-data';

type Props = {
  params: Promise<{ clientId: string; lookId: string }>;
};

export default function LookPage({ params }: Props) {
  const { clientId, lookId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const isGenerating = searchParams.get('generating') === '1';
  const [showLoader, setShowLoader] = useState(isGenerating);

  const client = clientById(clientId);
  const look = lookById(lookId);

  useEffect(() => {
    if (!isGenerating) return;
    setShowLoader(true);
    const t = setTimeout(() => {
      setShowLoader(false);
      router.replace(`/clients/${clientId}/looks/${lookId}`);
    }, 3000);
    return () => clearTimeout(t);
  }, [isGenerating, clientId, lookId, router]);

  if (!client || !look) {
    notFound();
  }

  const firstName = client.name.split(' ')[0] ?? client.name;

  return (
    <AppShell>
      {showLoader ? (
        <TryOnLoader clientFirstName={firstName} />
      ) : (
        <LookResult client={client} look={look} />
      )}
    </AppShell>
  );
}
