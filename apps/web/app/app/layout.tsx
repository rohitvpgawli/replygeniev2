'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, Settings as SettingsIcon, Activity, Menu, Inbox, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/app/dashboard" className="flex w-full items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="border-b border-border/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href="/app/dashboard"
          className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
            <span className="text-lg font-bold">R</span>
          </div>
          <span className="text-xl font-semibold">ReplyGenie</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-11" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/inbox', icon: Inbox, label: 'Inbox' },
    { href: '/app/activity', icon: Activity, label: 'Activity' },
    { href: '/app/audit', icon: FileText, label: 'Audit Log' },
    { href: '/app/settings', icon: SettingsIcon, label: 'Settings' }
  ];

  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex flex-1 w-full">
        {/* Mobile menu button - fixed position */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Sidebar overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            w-64 bg-white lg:bg-gray-50/50 border-r border-border/50
            lg:sticky lg:top-[73px] lg:h-[calc(100vh-73px)]
            fixed inset-y-0 left-0 z-50
            transform transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }
          `}
        >
          <nav className="h-full overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`
                      shadow-none w-full justify-start
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-4 border-primary pl-5'
                          : 'hover:bg-secondary/80 hover:translate-x-1 hover:shadow-sm'
                      }
                    `}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto w-full">{children}</main>
      </div>
    </section>
  );
}
