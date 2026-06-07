import AdminBranches from "@/features/erp/pages/Branches";

export default function AdminFamiliesPage() {
  return (
    <AdminBranches
      initialRoleFilter="family"
      title="Bereaved Families"
      description="Manage all bereaved families, read paid/free/banned state, change plans, ban, unban, or delete."
    />
  );
}
