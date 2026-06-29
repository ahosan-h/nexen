import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "sonner";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("font-sans", geist.variable)}>
        <body>
          {children}
          <Toaster richColors closeButton />
        </body>
      </html>
    </ClerkProvider>
  );
}
