import { redirect } from "next/navigation";
import { getDefaultLoginPathForMode } from "@/lib/auth";

export default function TeamLoginRedirectPage() {
  redirect(getDefaultLoginPathForMode("team"));
}
