import ManagerDashboard from "@/features/manager/pages/Dashboard";
import FreeProviderDashboard from "@/features/manager/pages/FreeProviderDashboard";
import { useAuth } from "@/components/auth/AuthProvider";

export default function VendorDashboard() {
  const { profile } = useAuth();
  const isPaid = Boolean(profile?.is_pro || profile?.plan_code === "pro" || profile?.plan_status === "paid" || profile?.plan_status === "active" || profile?.subscription_status === "active");
  return isPaid ? <ManagerDashboard /> : <FreeProviderDashboard />;
}
