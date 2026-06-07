import AdminBranches from "@/features/erp/pages/Branches";

export default function AdminVendorsPage() {
  return (
    <AdminBranches
      initialRoleFilter="marketplace"
      title="Vendors"
      description="Manage all vendors, read paid/free/banned state, change plans, ban, unban, or delete."
    />
  );
}
