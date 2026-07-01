"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

import {
  LayoutDashboard,
  BarChart3,
  Settings,
  Menu,
  BadgePlus,
  TriangleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Add Product",
    href: "/addProduct",
    icon: BadgePlus,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Report",
    href: "/expire-damage",
    icon: TriangleAlert,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-2xl">NexEn</span>
      </div>

      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
                active ? "bg-muted font-medium" : "hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t space-y-3 p-4 lg:hidden">
        <Separator />
        {isSignedIn ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Account</span>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 border border-border",
                },
              }}
            />
          </div>
        ) : (
          <SignInButton mode="modal">
            <Button className="w-full">Login</Button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r bg-background lg:block lg:z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="left"
          className="
           w-72 p-0
           data-[state=open]:animate-in
           data-[state=closed]:animate-out
           data-[state=open]:slide-in-from-left
           data-[state=closed]:slide-out-to-left
           duration-400
           "
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>
              Main application navigation links
            </SheetDescription>
          </SheetHeader>

          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
