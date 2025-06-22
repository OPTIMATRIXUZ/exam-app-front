'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

export function Header() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const { user, isAuthenticated, logout, loadUser } = useAuthStore();

  // 1) Mark hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // 2) Once hydrated & authenticated, reload the user
  useEffect(() => {
    if (!hydrated) return;
    if (isAuthenticated) {
      loadUser();
    }
  }, [hydrated, isAuthenticated, loadUser]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // 3) Don’t render until hydration is done
  if (!hydrated) {
    return null;  // or a small placeholder
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 p-2">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Examinator</span>
          </Link>

          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      {user?.user.full_name ?? 'User'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
