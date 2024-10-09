// UTILS
import { getServerAuthSession } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

// COMPONENTS
import ProtectedContent from "~/components/protectedContent";
import { Card } from "~/components/ui/card";
import AdminForceSync from "./_components/admin-force-sync";
import LogoutButton from "./_components/logout-button";
import NameChangeDialog from "./_components/name-change-dialog";
import ProfPicChangeDialog from "./_components/prof-pic-change-dialog";
import ThemePicker from "./_components/theme-picker";

// COMP
const AccountPage = async () => {
  const session = await getServerAuthSession();

  return (
    <HydrateClient>
      <ProtectedContent authedRoles={["ADMIN", "USER", "RESTRICTED"]}>
        <Card className="mt-8 flex w-2/5 flex-col flex-wrap items-center justify-center gap-8 rounded-md border-2 border-solid border-card-foreground bg-card p-4 text-card-foreground">
          <h1 className="text-3xl font-bold text-foreground">
            Account Settings
          </h1>
          <ProfPicChangeDialog session={session} />
          <div className="flex flex-col items-center justify-center gap-6">
            <NameChangeDialog session={session} />
          </div>

          <div
            // SETTINGS
            className="flex w-full flex-col items-center justify-center gap-6"
          >
            <AdminForceSync />
            <div
              // THEME
              className="flex w-full flex-col items-center gap-6"
            >
              <h3 className="text-2xl font-semibold text-foreground">Theme</h3>
              <ThemePicker />
            </div>
          </div>

          <LogoutButton />
        </Card>
      </ProtectedContent>
    </HydrateClient>
  );
};
export default AccountPage;
