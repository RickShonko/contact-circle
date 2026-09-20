import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { Brand } from "@/components/Brand";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const isAdmin = !!(await getSession("admin"));
  return (
    <div className="site">
      <header className="topbar">
        <Brand />
      </header>
      <main className={isAdmin ? "wide" : "narrow"}>{isAdmin ? <AdminDashboard /> : <AdminLogin />}</main>
    </div>
  );
}
