import ManagerDashboard from "@/features/manager/pages/Dashboard";
import FreeProviderDashboard from "@/features/manager/pages/FreeProviderDashboard";
import { useAuth } from "@/components/auth/AuthProvider";
import { isRealPaidProvider } from "@/lib/provider-plan";

export default function OperationsDashboard() {
  const { profile } = useAuth();
  return isRealPaidProvider(profile) ? <ManagerDashboard /> : <FreeProviderDashboard />;
}
