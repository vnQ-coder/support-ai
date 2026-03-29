"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import crypto from "node:crypto";
import { getAuthOrRedirect } from "@/lib/auth";
import {
  db,
  organizations,
  widgetConfigs,
  members,
  apiKeys,
} from "@repo/db";
import { eq, and } from "drizzle-orm";

// ---- Zod schemas ----------------------------------------------------------

const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name must be under 255 characters"),
  timezone: z.string().min(1, "Timezone is required"),
  businessHoursEnabled: z.enum(["true", "false"]),
});

const updateWidgetConfigSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  greeting: z
    .string()
    .min(1, "Greeting is required")
    .max(500, "Greeting must be under 500 characters"),
  placeholder: z
    .string()
    .min(1, "Placeholder is required")
    .max(200, "Placeholder must be under 200 characters"),
  position: z.enum(["bottom-right", "bottom-left"]),
  showBranding: z.enum(["true", "false"]),
  allowedDomains: z.string(),
});

const inviteMemberSchema = z.object({
  email: z.string().email("Must be a valid email"),
  role: z.enum(["admin", "agent"]),
});

const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be under 255 characters"),
  isLive: z.enum(["true", "false"]),
});

// ---- Helpers --------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---- Action return type ---------------------------------------------------

interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

// ---- Server Actions -------------------------------------------------------

export async function updateOrganization(
  formData: FormData
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  const raw = {
    name: formData.get("name") as string,
    timezone: formData.get("timezone") as string,
    businessHoursEnabled: formData.get("businessHoursEnabled") as string,
  };

  const parsed = updateOrganizationSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  try {
    await db
      .update(organizations)
      .set({
        name: parsed.data.name,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, internalOrgId));

    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update organization" };
  }
}

export async function updateWidgetConfig(
  formData: FormData
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  const raw = {
    primaryColor: formData.get("primaryColor") as string,
    greeting: formData.get("greeting") as string,
    placeholder: formData.get("placeholder") as string,
    position: formData.get("position") as string,
    showBranding: formData.get("showBranding") as string,
    allowedDomains: formData.get("allowedDomains") as string,
  };

  const parsed = updateWidgetConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  const domains = parsed.data.allowedDomains
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);

  try {
    const existing = await db
      .select({ id: widgetConfigs.id })
      .from(widgetConfigs)
      .where(eq(widgetConfigs.organizationId, internalOrgId))
      .limit(1);

    const values = {
      primaryColor: parsed.data.primaryColor,
      greeting: parsed.data.greeting,
      placeholder: parsed.data.placeholder,
      position: parsed.data.position,
      showBranding: parsed.data.showBranding === "true",
      allowedDomains: domains,
      updatedAt: new Date(),
    };

    if (existing[0]) {
      await db
        .update(widgetConfigs)
        .set(values)
        .where(eq(widgetConfigs.id, existing[0].id));
    } else {
      await db.insert(widgetConfigs).values({
        id: generateId(),
        organizationId: internalOrgId,
        ...values,
        createdAt: new Date(),
      });
    }

    revalidatePath("/settings/widget");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update widget config" };
  }
}

export async function inviteMember(
  formData: FormData
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  const raw = {
    email: formData.get("email") as string,
    role: formData.get("role") as string,
  };

  const parsed = inviteMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  try {
    // Check for existing member with same email
    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.organizationId, internalOrgId),
          eq(members.email, parsed.data.email)
        )
      )
      .limit(1);

    if (existing[0]) {
      return { success: false, error: "A member with this email already exists" };
    }

    await db.insert(members).values({
      id: generateId(),
      organizationId: internalOrgId,
      clerkUserId: `pending_${generateId()}`,
      role: parsed.data.role,
      email: parsed.data.email,
      name: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath("/settings/team");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to invite member" };
  }
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  if (!memberId || typeof memberId !== "string") {
    return { success: false, error: "Invalid member ID" };
  }

  try {
    // Verify member belongs to the org
    const member = await db
      .select({ id: members.id, role: members.role })
      .from(members)
      .where(
        and(
          eq(members.id, memberId),
          eq(members.organizationId, internalOrgId)
        )
      )
      .limit(1);

    if (!member[0]) {
      return { success: false, error: "Member not found" };
    }

    // Cannot remove the last owner
    if (member[0].role === "owner") {
      const ownerCount = await db
        .select({ id: members.id })
        .from(members)
        .where(
          and(
            eq(members.organizationId, internalOrgId),
            eq(members.role, "owner")
          )
        );

      if (ownerCount.length <= 1) {
        return { success: false, error: "Cannot remove the last owner" };
      }
    }

    await db.delete(members).where(eq(members.id, memberId));

    revalidatePath("/settings/team");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to remove member" };
  }
}

export async function createApiKey(
  formData: FormData
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  const raw = {
    name: formData.get("name") as string,
    isLive: formData.get("isLive") as string,
  };

  const parsed = createApiKeySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation failed" };
  }

  try {
    const isLive = parsed.data.isLive === "true";
    const prefix = isLive ? "sk_live_" : "sk_test_";
    const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    const fullKey = `${prefix}${randomPart}`;
    const keyHash = await hashKey(fullKey);
    const keyPrefix = fullKey.slice(0, 10);

    await db.insert(apiKeys).values({
      id: generateId(),
      organizationId: internalOrgId,
      name: parsed.data.name,
      keyHash,
      keyPrefix,
      isLive,
      createdAt: new Date(),
    });

    revalidatePath("/settings/api-keys");
    return { success: true, data: { key: fullKey } };
  } catch {
    return { success: false, error: "Failed to create API key" };
  }
}

export async function revokeApiKey(keyId: string): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  if (!keyId || typeof keyId !== "string") {
    return { success: false, error: "Invalid key ID" };
  }

  try {
    // Verify key belongs to the org
    const key = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.organizationId, internalOrgId)
        )
      )
      .limit(1);

    if (!key[0]) {
      return { success: false, error: "API key not found" };
    }

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    revalidatePath("/settings/api-keys");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to revoke API key" };
  }
}
