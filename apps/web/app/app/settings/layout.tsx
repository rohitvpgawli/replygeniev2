'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Plug, MessageSquare } from 'lucide-react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      href: '/app/settings/general',
      label: 'General',
      icon: Building2,
    },
    {
      href: '/app/settings/integrations',
      label: 'Integrations',
      icon: Plug,
    },
    {
      href: '/app/settings/brand-voice',
      label: 'Brand Voice',
      icon: MessageSquare,
    },
  ];

  return (
    <section className="flex-1 bg-gradient-to-b from-white to-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 lg:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/50 mb-8">
          <nav className="flex gap-6 -mb-px">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>{children}</div>
      </div>
    </section>
  );
}
