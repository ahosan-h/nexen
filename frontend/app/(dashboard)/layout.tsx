import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div>
        <Navbar />

        <main className="min-h-[calc(100vh-64px)] lg:ml-72 p-6">
          {children}
        </main>
      </div>
    </>
  );
}
