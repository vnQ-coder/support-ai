import { getAuthOrRedirect } from "@/lib/auth";
import { getOrgTags } from "@/lib/queries/tags";
import { CreateTagDialog } from "./create-tag-dialog";
import { DeleteTagButton } from "./delete-tag-button";

export const metadata = { title: "Labels — SupportAI" };

export default async function TagsSettingsPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const tagList = await getOrgTags(internalOrgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Labels</h2>
          <p className="text-sm text-muted-foreground">
            Categorize conversations with color-coded labels
          </p>
        </div>
        <CreateTagDialog />
      </div>

      {tagList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No labels yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border border-border">
          {tagList.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm font-medium">{tag.name}</span>
              </div>
              <DeleteTagButton tagId={tag.id} tagName={tag.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
