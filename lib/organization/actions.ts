"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasOrganization } from "@/lib/auth/profile";
import { routeForOnboarding } from "@/lib/auth/helpers";
import type { AuthActionState } from "@/lib/auth/action-state";
import {
  organizationSchema,
  type OrganizationValues,
} from "@/lib/auth/schemas";

/**
 * Onboarding: create (or re-link) the user's organization. Delegates the atomic
 * insert + profile-link to the SECURITY DEFINER RPC `create_organization_onboarding`
 * so the chicken-and-egg RLS gap (a NULL-org user cannot INSERT into
 * `organizations`) is bridged safely server-side. The caller's session is the
 * only credential; RLS still isolates the profile read.
 *
 * `organization_id` is derived entirely from the authenticated session inside
 * the RPC — a client can never supply or influence it.
 */
export async function createOrganizationAction(
  values: OrganizationValues,
): Promise<AuthActionState> {
  const parsed = organizationSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Please check your details and try again." };
  }
  const { name, type, logoUrl } = parsed.data;

  const supabase = createClient();
  const { error } = await supabase.rpc("create_organization_onboarding", {
    p_name: name,
    p_type: type,
    p_logo_url: logoUrl && logoUrl.length > 0 ? logoUrl : null,
  });

  if (error) {
    switch (error.code) {
      case "42501":
        return {
          ok: false,
          error: "You must be signed in to create an organization.",
        };
      case "P0001":
        return {
          ok: false,
          error:
            "Your account profile is missing. Please sign out and sign in again.",
        };
      case "22023":
        return {
          ok: false,
          error: "Please provide a valid name and institution type.",
        };
      default:
        return {
          ok: false,
          error:
            "Something went wrong creating your organization. Please try again.",
        };
    }
  }

  // Confirm the profile is now linked before navigating onward.
  const onboarded = await hasOrganization();
  if (!onboarded) {
    return {
      ok: false,
      error:
        "Something went wrong linking your organization. Please try again.",
    };
  }

  redirect(routeForOnboarding(true));
}
