import DashboardShell from "@/components/DashboardShell";

export default function HomePage() {
  return (
    <DashboardShell
      passwordProtectionEnabled={Boolean(process.env.DASHBOARD_ACCESS_PASSWORD?.trim())}
    />
  );
}
