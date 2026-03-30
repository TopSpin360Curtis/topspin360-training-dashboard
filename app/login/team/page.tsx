import ModeLoginScreen from "@/components/ModeLoginScreen";

export default async function TeamLoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextValue = resolvedSearchParams.next;
  const nextPath =
    typeof nextValue === "string"
      ? nextValue
      : Array.isArray(nextValue)
        ? nextValue[0] || "/"
        : "/";

  return <ModeLoginScreen mode="team" nextPath={nextPath} />;
}
