import { desc, ne, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { CreateStaffDialog } from "./create-staff-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { DeleteUserButton } from "./delete-user-button";
import { toggleUserActive } from "@/lib/actions/users";

export default async function AdminTeamPage() {
  const staff = await db
    .select()
    .from(users)
    .where(and(ne(users.role, "reseller"), isNull(users.deletedAt)))
    .orderBy(desc(users.createdAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">
            Admin, finance, and shipping staff logins.
          </p>
        </div>
        <CreateStaffDialog />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-2">
                  <Badge variant="outline" className="capitalize">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={u.active ? "default" : "outline"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                    {u.mustChangePassword && (
                      <Badge variant="outline">Must set password</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    <EditUserDialog
                      userId={u.id}
                      name={u.name}
                      email={u.email}
                      role={u.role as "admin" | "finance" | "shipping"}
                    />
                    <ResetPasswordDialog userId={u.id} name={u.name} />
                    <ToggleActiveButton
                      id={u.id}
                      active={u.active}
                      entityLabel="User"
                      onToggle={async (id, active) => {
                        "use server";
                        const result = await toggleUserActive(id, active);
                        if (result.error) throw new Error(result.error);
                      }}
                    />
                    <DeleteUserButton userId={u.id} name={u.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
