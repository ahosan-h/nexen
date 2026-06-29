"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Bell, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// import { Sidebar } from "./sidebar";

export function Navbar() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearch = () => {
    if (!query.trim()) return;

    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-16 flex items-center justify-between px-3 md:px-5 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3 shrink-0">
          {/* <Sidebar /> */}
          <span>NexEn</span>
        </div>

        {/* Desktop / Tablet Search */}
        <div className="hidden md:flex flex-1 justify-center px-4 lg:px-8">
          <div className="flex w-full max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />

              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search blogs..."
                className="pl-10"
              />
            </div>

            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button>
            <Bell />
          </Button>

          <ThemeToggle />

          <div className="hidden lg:block">
            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 md:h-9 md:w-9 border border-border",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <Button size="sm">Login</Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Drawer */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-border bg-background animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />

              <Input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blogs..."
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }

                  if (e.key === "Escape") {
                    setMobileSearchOpen(false);
                  }
                }}
              />
            </div>

            <Button onClick={handleSearch}>Go</Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSearchOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
