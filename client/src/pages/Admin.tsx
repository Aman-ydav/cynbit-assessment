import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "@/components/admin/Dashboard";
import { LoginForm } from "@/components/admin/LoginForm";
import { RouteFallback } from "@/components/site/RouteFallback";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";

type AuthState = "checking" | "anonymous" | "authenticated";

export default function Admin() {
  usePageTitle("Admin");
  const [auth, setAuth] = useState<AuthState>("checking");

  useEffect(() => {
    api
      .adminMe()
      .then(({ authenticated }) => setAuth(authenticated ? "authenticated" : "anonymous"))
      .catch(() => setAuth("anonymous"));
  }, []);

  // Belt and braces alongside the X-Robots-Tag header the server sends for /admin.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const signedOut = useCallback(() => setAuth("anonymous"), []);

  if (auth === "checking") return <RouteFallback />;
  if (auth === "anonymous") return <LoginForm onSuccess={() => setAuth("authenticated")} />;
  return <Dashboard onSignedOut={signedOut} />;
}
