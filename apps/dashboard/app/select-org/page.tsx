import { OrganizationList } from "@clerk/nextjs";

export const metadata = {
  title: "Select Organization — SupportAI",
};

export default function SelectOrgPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Select or Create an Organization
          </h1>
          <p className="text-sm text-zinc-400">
            Choose an existing organization or create a new one to get started
            with SupportAI.
          </p>
        </div>

        <OrganizationList
          afterSelectOrganizationUrl="/pricing"
          afterCreateOrganizationUrl="/pricing"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-zinc-900 border-zinc-800 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
            },
          }}
        />
      </div>
    </div>
  );
}
