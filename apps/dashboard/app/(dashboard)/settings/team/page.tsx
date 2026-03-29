import { getAuthOrRedirect } from "@/lib/auth";
import { getTeamMembers } from "@/lib/queries/settings";
import { TeamMemberList } from "@/components/settings/team-member-list";
import { InviteMemberForm } from "@/components/settings/invite-member-form";

export default async function TeamSettingsPage() {
  const { internalOrgId } = await getAuthOrRedirect();
  const teamMembers = await getTeamMembers(internalOrgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your organization
          </p>
        </div>
      </div>

      {/* Invite form */}
      <InviteMemberForm />

      {/* Team list */}
      <TeamMemberList members={teamMembers} />
    </div>
  );
}
