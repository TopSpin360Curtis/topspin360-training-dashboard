import { redirect } from "next/navigation";
import { getDefaultLoginPathForMode } from "@/lib/auth";

export default function TestLoginRedirectPage() {
  redirect(getDefaultLoginPathForMode("test"));
}
