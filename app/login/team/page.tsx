import { redirect } from "next/navigation";
import ModeLoginScreen from "@/components/ModeLoginScreen";
import { getDefaultLoginPathForMode, getDefaultTenantForMode } from "@/lib/auth";

export default async function TeamLoginRedirectPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = getDefaultTenantForMode("team");
  const nextValue = (await searchParams).next;
  const nextPath =
    typeof nextValue === "string"
      ? nextValue
      : Array.isArray(nextValue)
        ? nextValue[0] || "/"
        : "/";

  if (tenant?.id === "team") {
    return <ModeLoginScreen mode="team" nextPath={nextPath} tenant={tenant} />;
  }

  redirect(getDefaultLoginPathForMode("team"));
}
