import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { Layout } from "@/components/site/Layout";
import { RouteFallback } from "@/components/site/RouteFallback";
import Landing from "@/pages/Landing";

// Everything except the landing page is code-split to keep the first load small on mobile.
const Wizard = lazy(() => import("@/pages/Wizard"));
const Plan = lazy(() => import("@/pages/Plan"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Admin = lazy(() => import("@/pages/Admin"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="path" element={<Wizard />} />
          <Route path="plan/:code" element={<Plan />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
