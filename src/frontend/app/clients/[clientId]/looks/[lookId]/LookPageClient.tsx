'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shared/AppShell';
import { LookResult } from '@/components/try-on/LookResult';
import { TryOnLoader } from '@/components/try-on/TryOnLoader';
import type { Client, Look } from '@/lib/types';

type LookPageClientProps = {
  client: Client;
  look: Look;
};

export function LookPageClient({ client, look }: LookPageClientProps) {
  const router = useRouter();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const isGenerating =
      new URLSearchParams(window.location.search).get('generating') === '1';

    if (!isGenerating) {
      setShowLoader(false);
      return;
    }

    setShowLoader(true);
    const t = setTimeout(() => {
      setShowLoader(false);
      router.replace(`/clients/${client.id}/looks/${look.id}`);
    }, 3000);

    return () => clearTimeout(t);
  }, [client.id, look.id, router]);

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
