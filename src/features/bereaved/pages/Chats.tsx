import PortalLayout from "@/components/layout/PortalLayout";
import ResponsiveChatHub from "@/components/ResponsiveChatHub";

const FamilyChats = () => {
  return (
    <PortalLayout portalType="family">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-[var(--ink)]">Chats</h2>
          <p className="text-[var(--muted)]">Open your funeral home/vendor conversations and continue planning from one place.</p>
        </div>
        <ResponsiveChatHub mode="family" />
      </div>
    </PortalLayout>
  );
};

export default FamilyChats;
