import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import React, { lazy, Suspense, useEffect, useState } from "react";
import type { StrutaNotification } from "./utils/notifications";
import { NotificationCenter } from "./components/NotificationCenter";
import SiteUpdatePopup from "./components/SiteUpdatePopup";
import DominoLoader from "./components/DominoLoader";
import { captureReferralFromUrl } from "./lib/referrals";
import ProFeatureRoute from "./components/ProFeatureRoute";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const Help = lazy(() => import("./pages/Help"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentError = lazy(() => import("./pages/PaymentError"));

const Login = lazy(() => import("./features/auth/pages/LoginPasswordOnly"));
const SignupSelection = lazy(() => import("./features/auth/pages/SignupSelection"));
const ForgotPassword = lazy(() => import("./features/auth/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./features/auth/pages/ResetPassword"));
const AuthCallback = lazy(() => import("./features/auth/pages/AuthCallback"));
const AccountBanned = lazy(() => import("./features/auth/pages/AccountBanned"));
const SignupBereaved = lazy(() => import("./features/bereaved/pages/Signup"));
const SignupHome = lazy(() => import("./features/funeral-home/pages/Signup"));
const SignupVendor = lazy(() => import("./features/marketplace/pages/Signup"));
const StaffSignup = lazy(() => import("./features/manager/pages/StaffSignup"));
const AdminRedirect = lazy(() => import("./components/AdminRedirect").then((module) => ({ default: module.AdminRedirect })));

const FamilyDashboard = lazy(() => import("./features/bereaved/pages/Dashboard"));
const SearchHomes = lazy(() => import("./features/bereaved/pages/Search"));
const FamilyRequests = lazy(() => import("./features/bereaved/pages/Requests"));
const FamilyChats = lazy(() => import("./features/bereaved/pages/Chats"));
const FamilyMemorials = lazy(() => import("./features/bereaved/pages/Memorials"));
const FamilySettings = lazy(() => import("./features/bereaved/pages/Settings"));
const FamilyProfile = lazy(() => import("./features/bereaved/pages/Profile"));

const OperationsDashboard = lazy(() => import("./features/funeral-home/pages/Dashboard"));
const CaseManagement = lazy(() => import("./features/funeral-home/pages/Cases"));
const OperationsInventory = lazy(() => import("./features/funeral-home/pages/Inventory"));
const BillingPage = lazy(() => import("./features/funeral-home/pages/Billing"));
const OperationsSettings = lazy(() => import("./features/funeral-home/pages/Settings"));

const StaffPage = lazy(() => import("./features/staff/pages/Staff"));
const StaffRequestsPage = lazy(() => import("./features/staff/pages/Requests"));
const StaffReportsPage = lazy(() => import("./features/staff/pages/Reports"));
const SecretaryDashboard = lazy(() => import("./features/staff/pages/SecretaryDashboard"));
const DriverDashboard = lazy(() => import("./features/staff/pages/DriverDashboard"));
const EmbalmerDashboard = lazy(() => import("./features/staff/pages/EmbalmerDashboard"));
const CoordinatorDashboard = lazy(() => import("./features/staff/pages/CoordinatorDashboard"));

const VendorDashboard = lazy(() => import("./features/marketplace/pages/Dashboard"));
const VendorOrders = lazy(() => import("./features/marketplace/pages/Orders"));
const VendorCatalog = lazy(() => import("./features/marketplace/pages/Catalog"));
const VendorInventory = lazy(() => import("./features/marketplace/pages/Inventory"));
const VendorSettings = lazy(() => import("./features/marketplace/pages/Settings"));

const AdminFinance = lazy(() => import("./features/erp/pages/Finance"));
const AdminBranches = lazy(() => import("./features/erp/pages/Branches"));
const AdminCompliance = lazy(() => import("./features/erp/pages/Compliance"));
const AdminRequests = lazy(() => import("./features/erp/pages/Requests"));
const AdminDashboardPage = lazy(() => import("./features/admin/pages/Dashboard"));
const AdminReportsPage = lazy(() => import("./features/admin/pages/Reports"));
const AdminPaymentsPage = lazy(() => import("./features/admin/pages/Payments"));
const AdminCustomisePage = lazy(() => import("./features/admin/pages/Customise"));

const ManagerDashboardPage = lazy(() => import("./features/manager/pages/Dashboard"));
const ManagerCasesPage = lazy(() => import("./features/manager/pages/Cases"));
const ManagerSettingsPage = lazy(() => import("./features/manager/pages/Settings"));
const ManagerTasksPage = lazy(() => import("./features/manager/pages/Tasks"));
const ManagerTaskDetailsPage = lazy(() => import("./features/manager/pages/TaskDetails"));
const ManagerSchedulePage = lazy(() => import("./features/manager/pages/Schedule"));
const ManagerMessagesPage = lazy(() => import("./features/manager/pages/Messages"));
const ManagerStaffPage = lazy(() => import("./features/manager/pages/Staff"));
const ManagerRequestsPage = lazy(() => import("./features/manager/pages/Requests"));
const ManagerReportsPage = lazy(() => import("./features/manager/pages/Reports"));
const ManagerVehiclesPage = lazy(() => import("./features/manager/pages/Vehicles"));
const ManagerBillingPage = lazy(() => import("./features/manager/pages/Billing"));

const TributePage = lazy(() => import("./features/memorial/pages/Tribute"));
const CreateMemorial = lazy(() => import("./features/memorial/pages/CreateMemorial"));
const MemorialCustomize = lazy(() => import("./features/memorial/pages/Customize"));
const MemorialDesign = lazy(() => import("./features/memorial/pages/Design"));
const InvitationClaim = lazy(() => import("./features/bereaved/pages/InvitationClaim"));

const queryClient = new QueryClient();
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => { const { session, profile, loading } = useAuth(); if (loading && !session) return <DominoLoader message="Verifying secure session..." fullscreen />; if (!loading && !session) return <Navigate to="/login" replace />; if (!loading && allowedRoles && profile) { const userRole = profile.role; if (allowedRoles.includes("operations")) { const isErpStaff = ["Secretary", "Driver", "Embalmer", "Coordinator"].includes(userRole); if (isErpStaff && profile?.staff_business_type === "vendor") return <Navigate to="/marketplace" replace />; const isOpsStaff = ["operations", "Manager", "Secretary", "Driver", "Embalmer", "Coordinator", "Secretary / Admin officer", "Driver / Transport officer", "Inventory / Stores staff", "Counselor / Arranger"].includes(userRole); if (!isOpsStaff) return <Navigate to="/" replace />; } else if (allowedRoles.includes("marketplace")) { const isErpStaff = ["Secretary", "Driver", "Embalmer", "Coordinator"].includes(userRole); if (isErpStaff && profile?.staff_business_type !== "vendor") return <Navigate to="/operations" replace />; const isMarketStaff = ["marketplace", "Owner / Manager", "Manager", "Secretary", "Driver", "Embalmer", "Coordinator", "Sales / Bookings officer", "Delivery / Setup team", "Inventory staff", "Accountant / Cashier"].includes(userRole); if (!isMarketStaff) return <Navigate to="/" replace />; } else if (!allowedRoles.includes(userRole)) return <Navigate to="/" replace />; } return <>{children}</>; };
const ReferralTracker = () => { useEffect(() => { void captureReferralFromUrl(); }, []); return null; };
const NotificationListener = () => { const [notifications] = useState<StrutaNotification[]>([]); const { profile } = useAuth(); useEffect(() => { if (!profile?.user_id) return; const handleNotificationUpdate = () => {}; window.addEventListener("struta_notifications_updated", handleNotificationUpdate); return () => window.removeEventListener("struta_notifications_updated", handleNotificationUpdate); }, [profile?.user_id]); const handleDismiss = async (id: string) => { if (!profile?.user_id) return; try { const { deleteNotification } = await import("./utils/notifications"); await deleteNotification(profile.user_id, id); } catch (error) { console.error("Failed to delete notification:", error); } }; return <NotificationCenter notifications={notifications} onDismiss={handleDismiss} />; };

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AuthProvider><TooltipProvider><ReferralTracker /><Toaster /><Sonner /><NotificationListener /><SiteUpdatePopup /><Suspense fallback={<DominoLoader message="Loading page..." fullscreen />}><Routes>
      <Route path="/" element={<Index />} /><Route path="/login" element={<Login />} /><Route path="/pricing" element={<Pricing />} /><Route path="/signup" element={<SignupSelection />} /><Route path="/staff/login" element={<StaffSignup />} /><Route path="/staff/auth" element={<Navigate to="/staff/login" replace />} /><Route path="/signup/staff" element={<Navigate to="/staff/login" replace />} /><Route path="/staffs/pages/auth" element={<Navigate to="/staff/login" replace />} /><Route path="/staffs/auth" element={<Navigate to="/staff/login" replace />} /><Route path="/signup/bereaved" element={<SignupBereaved />} /><Route path="/signup/home" element={<SignupHome />} /><Route path="/signup/vendor" element={<SignupVendor />} /><Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/reset-password" element={<ResetPassword />} /><Route path="/auth/callback" element={<AuthCallback />} /><Route path="/account-banned" element={<AccountBanned />} /><Route path="/privacy" element={<Privacy />} /><Route path="/terms" element={<Terms />} /><Route path="/terms-of-use" element={<TermsOfUse />} /><Route path="/contact" element={<Contact />} /><Route path="/about" element={<About />} /><Route path="/help" element={<Help />} /><Route path="/payment-success" element={<PaymentSuccess />} /><Route path="/payment-error" element={<PaymentError />} /><Route path="/admin-redirect" element={<AdminRedirect />} />
      <Route path="/family" element={<ProtectedRoute allowedRoles={["family"]}><FamilyDashboard /></ProtectedRoute>} /><Route path="/family/search" element={<ProtectedRoute allowedRoles={["family"]}><SearchHomes /></ProtectedRoute>} /><Route path="/family/requests" element={<ProtectedRoute allowedRoles={["family"]}><FamilyRequests /></ProtectedRoute>} /><Route path="/family/chats" element={<ProtectedRoute allowedRoles={["family"]}><FamilyChats /></ProtectedRoute>} /><Route path="/family/memorials" element={<ProtectedRoute allowedRoles={["family"]}><FamilyMemorials /></ProtectedRoute>} /><Route path="/family/memorials/create" element={<ProtectedRoute allowedRoles={["family"]}><CreateMemorial /></ProtectedRoute>} /><Route path="/family/memorials/customize" element={<ProtectedRoute allowedRoles={["family"]}><MemorialCustomize /></ProtectedRoute>} /><Route path="/family/memorials/design" element={<ProtectedRoute allowedRoles={["family"]}><MemorialDesign /></ProtectedRoute>} /><Route path="/family/settings" element={<ProtectedRoute allowedRoles={["family"]}><FamilySettings /></ProtectedRoute>} /><Route path="/family/profile" element={<ProtectedRoute allowedRoles={["family"]}><FamilyProfile /></ProtectedRoute>} /><Route path="/family/billing" element={<Navigate to="/family" replace />} />
      <Route path="/operations" element={<ProtectedRoute allowedRoles={["operations"]}><OperationsDashboard /></ProtectedRoute>} /><Route path="/operations/secretary" element={<ProFeatureRoute redirectTo="/operations/billing"><SecretaryDashboard /></ProFeatureRoute>} /><Route path="/operations/driver" element={<ProFeatureRoute redirectTo="/operations/billing"><DriverDashboard /></ProFeatureRoute>} /><Route path="/operations/embalmer" element={<ProFeatureRoute redirectTo="/operations/billing"><EmbalmerDashboard /></ProFeatureRoute>} /><Route path="/operations/coordinator" element={<ProFeatureRoute redirectTo="/operations/billing"><CoordinatorDashboard /></ProFeatureRoute>} /><Route path="/operations/cases" element={<ProtectedRoute allowedRoles={["operations"]}><CaseManagement /></ProtectedRoute>} /><Route path="/operations/staff" element={<ProFeatureRoute redirectTo="/operations/billing"><StaffPage /></ProFeatureRoute>} /><Route path="/operations/requests" element={<ProtectedRoute allowedRoles={["operations"]}><StaffRequestsPage /></ProtectedRoute>} /><Route path="/operations/chats" element={<ProtectedRoute allowedRoles={["operations"]}><ManagerMessagesPage /></ProtectedRoute>} /><Route path="/operations/reports" element={<ProFeatureRoute redirectTo="/operations/billing"><StaffReportsPage /></ProFeatureRoute>} /><Route path="/operations/inventory" element={<ProFeatureRoute redirectTo="/operations/billing"><OperationsInventory /></ProFeatureRoute>} /><Route path="/operations/billing" element={<ProtectedRoute allowedRoles={["operations"]}><BillingPage /></ProtectedRoute>} /><Route path="/operations/settings" element={<ProtectedRoute allowedRoles={["operations"]}><OperationsSettings /></ProtectedRoute>} /><Route path="/operations/profile" element={<ProtectedRoute allowedRoles={["operations"]}><FamilyProfile /></ProtectedRoute>} />
      <Route path="/manager/*" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerDashboardPage /></ProFeatureRoute>} /><Route path="/manager/cases" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerCasesPage /></ProFeatureRoute>} /><Route path="/manager/settings" element={<ProtectedRoute allowedRoles={["operations", "marketplace", "Manager", "Owner / Manager"]}><ManagerSettingsPage /></ProtectedRoute>} /><Route path="/manager/tasks" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerTasksPage /></ProFeatureRoute>} /><Route path="/manager/taskdetails" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerTaskDetailsPage /></ProFeatureRoute>} /><Route path="/manager/schedule" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerSchedulePage /></ProFeatureRoute>} /><Route path="/manager/messages" element={<ProtectedRoute allowedRoles={["operations", "marketplace", "Manager", "Owner / Manager"]}><ManagerMessagesPage /></ProtectedRoute>} /><Route path="/manager/staff" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerStaffPage /></ProFeatureRoute>} /><Route path="/manager/requests" element={<ProtectedRoute allowedRoles={["operations", "marketplace", "Manager", "Owner / Manager"]}><ManagerRequestsPage /></ProtectedRoute>} /><Route path="/manager/reports" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerReportsPage /></ProFeatureRoute>} /><Route path="/manager/vehicles" element={<ProFeatureRoute redirectTo="/operations/billing"><ManagerVehiclesPage /></ProFeatureRoute>} /><Route path="/manager/billing" element={<ProtectedRoute allowedRoles={["operations", "marketplace", "Manager", "Owner / Manager"]}><ManagerBillingPage /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorDashboard /></ProtectedRoute>} /><Route path="/marketplace/secretary" element={<ProFeatureRoute redirectTo="/marketplace/billing"><SecretaryDashboard /></ProFeatureRoute>} /><Route path="/marketplace/driver" element={<ProFeatureRoute redirectTo="/marketplace/billing"><DriverDashboard /></ProFeatureRoute>} /><Route path="/marketplace/embalmer" element={<ProFeatureRoute redirectTo="/marketplace/billing"><EmbalmerDashboard /></ProFeatureRoute>} /><Route path="/marketplace/coordinator" element={<ProFeatureRoute redirectTo="/marketplace/billing"><CoordinatorDashboard /></ProFeatureRoute>} /><Route path="/marketplace/orders" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorOrders /></ProtectedRoute>} /><Route path="/marketplace/staff" element={<ProFeatureRoute redirectTo="/marketplace/billing"><StaffPage /></ProFeatureRoute>} /><Route path="/marketplace/catalog" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorCatalog /></ProtectedRoute>} /><Route path="/marketplace/chats" element={<ProtectedRoute allowedRoles={["marketplace"]}><ManagerMessagesPage /></ProtectedRoute>} /><Route path="/marketplace/inventory" element={<ProFeatureRoute redirectTo="/marketplace/billing"><VendorInventory /></ProFeatureRoute>} /><Route path="/marketplace/billing" element={<ProtectedRoute allowedRoles={["marketplace"]}><BillingPage /></ProtectedRoute>} /><Route path="/marketplace/settings" element={<ProtectedRoute allowedRoles={["marketplace"]}><VendorSettings /></ProtectedRoute>} /><Route path="/marketplace/profile" element={<ProtectedRoute allowedRoles={["marketplace"]}><FamilyProfile /></ProtectedRoute>} />
      <Route path="/vendor" element={<Navigate to="/marketplace" replace />} /><Route path="/vendor/dashboard" element={<Navigate to="/marketplace" replace />} /><Route path="/vendor/bookings" element={<Navigate to="/marketplace/orders" replace />} /><Route path="/vendor/inventory" element={<Navigate to="/marketplace/inventory" replace />} /><Route path="/vendor/settings" element={<Navigate to="/marketplace/settings" replace />} /><Route path="/vendor/tasks" element={<Navigate to="/manager/tasks" replace />} /><Route path="/vendor/taskdetails" element={<Navigate to="/manager/taskdetails" replace />} /><Route path="/vendor/schedule" element={<Navigate to="/manager/schedule" replace />} /><Route path="/vendor/messages" element={<Navigate to="/marketplace/chats" replace />} /><Route path="/vendor/staff" element={<Navigate to="/marketplace/staff" replace />} /><Route path="/vendor/requests" element={<Navigate to="/manager/requests" replace />} /><Route path="/vendor/reports" element={<Navigate to="/manager/reports" replace />} /><Route path="/vendor/pricing" element={<Navigate to="/marketplace/catalog" replace />} /><Route path="/vendor/billing" element={<Navigate to="/marketplace/billing" replace />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} /><Route path="/admin/requests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRequests /></ProtectedRoute>} /><Route path="/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPaymentsPage /></ProtectedRoute>} /><Route path="/admin/reports" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReportsPage /></ProtectedRoute>} /><Route path="/admin/finance" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFinance /></ProtectedRoute>} /><Route path="/admin/branches" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBranches /></ProtectedRoute>} /><Route path="/admin/compliance" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCompliance /></ProtectedRoute>} /><Route path="/admin/customise" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCustomisePage /></ProtectedRoute>} />
      <Route path="/memorial/:slug" element={<TributePage />} /><Route path="/invitation/:token" element={<InvitationClaim />} /><Route path="*" element={<NotFound />} />
    </Routes></Suspense></TooltipProvider></AuthProvider></BrowserRouter>
  </QueryClientProvider>
);

export default App;
