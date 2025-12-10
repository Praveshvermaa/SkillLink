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
          <Image
            src="/skilllink-logo.png"
            alt="SkillLink Logo"
            width={40}
            height={40}
            className="object-contain"
            style={{ width: "auto", height: "auto" }}
          />
          <span className="text-xl font-bold tracking-tight">SkillLink</span>
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
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
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
