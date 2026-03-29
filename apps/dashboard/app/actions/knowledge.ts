"use server";

import { revalidatePath } from "next/cache";
import { getAuthOrRedirect } from "@/lib/auth";
import { deleteKnowledgeSource } from "@/lib/queries/knowledge";

/**
 * Server Action: Delete a knowledge source and revalidate the knowledge page.
 */
export async function deleteKnowledgeSourceAction(sourceId: string) {
  const { internalOrgId } = await getAuthOrRedirect();

  if (!sourceId || typeof sourceId !== "string") {
    return { success: false, error: "Invalid source ID" };
  }

  const result = await deleteKnowledgeSource(sourceId, internalOrgId);

  if (result.success) {
    revalidatePath("/knowledge");
  }

  return result;
}
