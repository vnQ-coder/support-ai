"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthOrRedirect } from "@/lib/auth";
import { createCannedResponse, updateCannedResponse, softDeleteCannedResponse, searchByShortcut } from "@/lib/queries/canned-responses";

const Schema = z.object({
  shortcut: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, hyphens"),
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  isShared: z.boolean().default(true),
});

export async function createCannedResponseAction(data: unknown) {
  const { internalOrgId } = await getAuthOrRedirect();
  const validated = Schema.parse(data);
  await createCannedResponse(internalOrgId, validated);
  revalidatePath("/settings/canned-responses");
}

export async function updateCannedResponseAction(id: string, data: unknown) {
  const { internalOrgId } = await getAuthOrRedirect();
  const validated = Schema.partial().parse(data);
  await updateCannedResponse(id, internalOrgId, validated);
  revalidatePath("/settings/canned-responses");
}

export async function deleteCannedResponseAction(id: string) {
  const { internalOrgId } = await getAuthOrRedirect();
  await softDeleteCannedResponse(id, internalOrgId);
  revalidatePath("/settings/canned-responses");
}

export async function searchCannedResponsesAction(prefix: string) {
  const { internalOrgId } = await getAuthOrRedirect();
  return searchByShortcut(internalOrgId, prefix);
}
