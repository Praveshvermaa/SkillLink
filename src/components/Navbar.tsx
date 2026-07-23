"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, User2 } from "lucide-react";
import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { signout } from "@/app/auth/actions";
import { toast } from "sonner";

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Treat reset-password page as guest page (show login/signup instead of profile/logout)
  const isResetPasswordPage = pathname === '/auth/reset-password';
  const showGuestNav = !user || isResetPasswordPage;

  const routes = [
    { href: "/skills", label: "Find Skills" },
    { href: "/map", label: "Map" },
    { href: "/bookings", label: "Bookings" },
    { href: "/chat", label: "Messages" },
  ];

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    try {
      const result = await signout();
      if (result?.success) {
        toast.dismiss(toastId);
        router.push("/auth/login");
        toast.success("Logged out successfully");
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to logout");
    }
  };

  const NavItem = ({ href, label }: any) => (
    <Link
      key={href}
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors px-2 py-1",
        pathname === href
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      {pathname === href && (
        <motion.div
          layoutId="nav-highlight"
          className="absolute inset-x-0 -bottom-[3px] h-[2px] bg-primary rounded-full"
        />
      )}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full max-w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <path d="M24 10C24 7.5 21.5 6 18 6C13 6 10 9 10 13C10 18 14 18 18 20C22 22 22 24 22 26C22 28.5 19.5 29.5 16 29.5C12 29.5 8 27.5 8 25" stroke="url(#logo-grad)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="24" cy="10" r="3" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
            <circle cx="15" cy="18.5" r="2.5" fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
            <circle cx="8" cy="25" r="3" fill="#ec4899" stroke="white" strokeWidth="1.5" />
          </svg>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">SkillLink</span>
        </Link>

        {/* Desktop Nav */}
        {!showGuestNav && (
          <nav className="hidden md:flex items-center gap-6">
            {routes.map((r) => (
              <NavItem key={r.href} href={r.href} label={r.label} />
            ))}
          </nav>
        )}

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />

          {showGuestNav ? (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="rounded-full border-border/60 hover:bg-muted/50 px-4">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500 hover:opacity-90 transition-opacity text-white border-0 font-medium px-4">
                  Get Started
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User2 className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-3 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}

            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t p-4 space-y-4 bg-background/95 backdrop-blur"
          >
            <nav className="flex flex-col gap-4">
              {!showGuestNav &&
                routes.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "text-sm font-medium transition-colors",
                      pathname === r.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {r.label}
                  </Link>
                ))}

              {/* Mobile bottom actions */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {showGuestNav ? (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
                        Log in
                      </Button>
                    </Link>

                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full justify-start">
                        Get Started
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
                        <User2 className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
