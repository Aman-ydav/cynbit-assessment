import { Outlet } from "react-router";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { ScrollManager } from "@/components/site/ScrollManager";

export function Layout() {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
