"use client";

import { usePWA } from "@/hooks/usePWA";

export default function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white text-center py-1.5 px-4 text-sm font-medium">
      You&apos;re offline — some features may be unavailable
    </div>
  );
}
