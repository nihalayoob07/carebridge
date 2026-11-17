import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/supabase";
import { Loading } from "./ui";

/** Renders children only for signed-in users with the given role; otherwise redirects. */
export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <Loading />;
  if (!session || !profile) return <Redirect href="/login" />;
  if (profile.role !== role) return <Redirect href={homeFor(profile.role) as any} />;
  return <>{children}</>;
}
