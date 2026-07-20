import { notFound, redirect } from "next/navigation";
import ModeLoginScreen from "@/components/ModeLoginScreen";
import { getTenantByLoginRoute } from "@/lib/auth";
import { isTenantUsingAuthV2Live } from "@/lib/authV2";

export default async function TenantLoginPage({
  params,
  searchParams
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const tenant = getTenantByLoginRoute(resolvedParams.tenant);

  if (!tenant) {
    notFound();
  }

  if (isTenantUsingAuthV2Live(tenant.loginRoute)) {
    redirect(`/auth-v2/${tenant.loginRoute}`);
  }

  const resolvedSearchParams = await searchParams;
  const nextValue = resolvedSearchParams.next;
  const nextPath =
    typeof nextValue === "string"
      ? nextValue
      : Array.isArray(nextValue)
        ? nextValue[0] || "/"
        : "/";

  return <ModeLoginScreen mode={tenant.profile} nextPath={nextPath} tenant={tenant} />;
}
