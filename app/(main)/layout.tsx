"use client";

import { Header } from "@/components/layout/Header";
import { OscarProvider } from "@/components/oscar/OscarContext";
import { SheetProvider } from "@/contexts/SheetContext";
import { OscarPresence } from "@/components/oscar/OscarPresence";
import { useOscar } from "@/components/oscar/OscarContext";

function OscarMessages() {
  const { messages, dismissMessage } = useOscar();
  return <OscarPresence messages={messages} onDismiss={dismissMessage} />;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SheetProvider>
      <OscarProvider>
        <div className="min-h-screen bg-slate-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
        <OscarMessages />
      </OscarProvider>
    </SheetProvider>
  );
}

