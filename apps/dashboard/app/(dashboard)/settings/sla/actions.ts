"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthOrRedirect } from "@/lib/auth";
import {
  createSlaPolicy,
  updateSlaPolicy,
  deleteSlaPolicy,
} from "@/lib/queries/sla";

// ---- Zod Schemas ----------------------------------------------------------

const CreateSlaPolicySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be under 255 characters"),
  description: z.string().max(1000).optional(),
  firstResponseMinutes: z.coerce
    .number()
    .int()
    .min(1, "Must be at least 1 minute")
    .max(10080, "Must be under 7 days"),
  resolutionMinutes: z.coerce
    .number()
    .int()
    .min(1, "Must be at least 1 minute")
    .max(43200, "Must be under 30 days"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  isDefault: z.boolean(),
});

const UpdateSlaPolicySchema = CreateSlaPolicySchema.partial();

// ---- Action return type ---------------------------------------------------

interface ActionResult {
  success: boolean;
  error?: string;
}

// ---- Server Actions -------------------------------------------------------

export async function createSlaPolicyAction(
  data: unknown
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  const parsed = CreateSlaPolicySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Validation failed",
    };
  }

  try {
    await createSlaPolicy(internalOrgId, parsed.data);
    revalidatePath("/settings/sla");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to create SLA policy" };
  }
}

export async function updateSlaPolicyAction(
  id: string,
  data: unknown
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  if (!id || typeof id !== "string") {
    return { success: false, error: "Invalid policy ID" };
  }

  const parsed = UpdateSlaPolicySchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Validation failed",
    };
  }

  try {
    await updateSlaPolicy(id, internalOrgId, parsed.data);
    revalidatePath("/settings/sla");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update SLA policy" };
  }
}

export async function deleteSlaPolicyAction(
  id: string
): Promise<ActionResult> {
  const { internalOrgId } = await getAuthOrRedirect();

  if (!id || typeof id !== "string") {
    return { success: false, error: "Invalid policy ID" };
  }

  try {
    await deleteSlaPolicy(id, internalOrgId);
    revalidatePath("/settings/sla");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete SLA policy" };
  }
}
