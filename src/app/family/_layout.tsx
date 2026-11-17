import { RoleGate } from "@/components/guard";
import { RoleTabs } from "@/components/blocks";

export default function FamilyLayout() {
  return (
    <RoleGate role="family">
      <RoleTabs base="/family" tabs={[
        { name: "index", title: "Home", icon: "home" },
        { name: "find", title: "Find care", icon: "search" },
        { name: "patients", title: "Patients", icon: "users" },
        { name: "bookings", title: "Bookings", icon: "calendar" },
      ]} />
    </RoleGate>
  );
}
