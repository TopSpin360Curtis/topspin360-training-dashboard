import { notFound } from "next/navigation";
import ModeLoginScreen from "@/components/ModeLoginScreen";
import { getTenantById } from "@/lib/auth";

export default async function TenantLoginPage({
  params,
  searchParams
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const tenant = getTenantById(resolvedParams.tenant);

  if (!tenant) {
    notFound();
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
