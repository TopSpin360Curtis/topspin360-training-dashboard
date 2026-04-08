import { redirect } from "next/navigation";
import ModeLoginScreen from "@/components/ModeLoginScreen";
import { getDefaultLoginPathForMode, getDefaultTenantForMode } from "@/lib/auth";

export default async function TestLoginRedirectPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = getDefaultTenantForMode("test");
  const nextValue = (await searchParams).next;
  const nextPath =
    typeof nextValue === "string"
      ? nextValue
      : Array.isArray(nextValue)
        ? nextValue[0] || "/"
        : "/";

  if (tenant?.loginRoute === "test") {
    return <ModeLoginScreen mode="test" nextPath={nextPath} tenant={tenant} />;
  }

  redirect(getDefaultLoginPathForMode("test"));
}
