import type { ReactNode } from "react";

/** Wraps every /admin route, login included, in the dark admin theme (see .admin-dark in globals.css). */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="admin-dark min-h-screen">{children}</div>;
}
