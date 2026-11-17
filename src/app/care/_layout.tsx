import { RoleGate } from "@/components/guard";
import { RoleTabs } from "@/components/blocks";

export default function CaregiverLayout() {
  return (
    <RoleGate role="caregiver">
      <RoleTabs tabs={[
        { name: "index", title: "Today", icon: "sun" },
        { name: "bookings", title: "Bookings", icon: "calendar" },
        { name: "profile", title: "Profile", icon: "user" },
      ]} />
    </RoleGate>
  );
}
