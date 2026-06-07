import AdminBranches from "@/features/erp/pages/Branches";

export default function AdminHomesPage() {
  return (
    <AdminBranches
      initialRoleFilter="operations"
      title="Homes"
      description="Manage all funeral homes, read paid/free/banned state, change plans, ban, unban, or delete."
    />
  );
}
