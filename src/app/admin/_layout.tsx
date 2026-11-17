import { RoleGate } from "@/components/guard";
import { RoleTabs } from "@/components/blocks";

export default function AdminLayout() {
  return (
    <RoleGate role="admin">
      <RoleTabs base="/admin" tabs={[
        { name: "index", title: "Insights", icon: "chart" },
        { name: "verify", title: "Verify", icon: "shield" },
        { name: "bookings", title: "Bookings", icon: "calendar" },
      ]} />
    </RoleGate>
  );
}
