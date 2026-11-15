import { ArrowRight, Menu } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Logo } from "@/components/site/Logo";
import { NAV_LINKS } from "@/components/site/nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function MarketingNav() {
  return (
    <>
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button asChild size="default" className="hidden sm:inline-flex">
          <Link to="/path">
            Build my plan <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(88vw,22rem)]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>Jump to a section or start your plan.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.to}>
                  <Link to={link.to} className="hover:bg-muted rounded-xl px-3 py-3 text-base font-semibold">
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              <SheetClose asChild>
                <Link
                  to="/privacy"
                  className="hover:bg-muted text-muted-foreground rounded-xl px-3 py-3 text-base font-semibold"
                >
                  Privacy
                </Link>
              </SheetClose>
            </nav>
            <div className="mt-auto p-4">
              <SheetClose asChild>
                <Button asChild size="xl" className="w-full">
                  <Link to="/path">
                    Build my plan <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function Header() {
  // The admin screen is an internal tool: keep the logo, drop the marketing navigation.
  const isAdmin = useLocation().pathname.startsWith("/admin");

  return (
    <header className="no-print bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        {isAdmin ? (
          <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-bold">
            Admin
          </span>
        ) : (
          <MarketingNav />
        )}
      </div>
    </header>
  );
}
