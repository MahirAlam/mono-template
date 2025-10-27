import { redirect } from "next/navigation";

import { basicInfo } from "@tera/config";

import AppLogo from "~/components/Logo";
import { DotPattern } from "~/components/ui/dot-pattern";
import { getSession } from "~/lib/auth/server";
import { cn } from "~/lib/utils";

export default async function MainLayout(props: { children: React.ReactNode }) {
  const session = await getSession();

  if (session) {
    return redirect("/");
  }

  return (
    <main className="min-h-screen pt-6">
      <DotPattern
        className={cn(
          "mask-[radial-gradient(farthest-side_at_center_center,white,transparent)]",
        )}
      />
      <div className="z-30 flex flex-col items-center justify-center px-4">
        <div className="mb-4 flex flex-col items-center justify-center text-center">
          <AppLogo className="h-10" />
          <p className="text-muted-foreground text-xs">
            {basicInfo.basic.description}
          </p>
        </div>
        {props.children}
      </div>
    </main>
  );
}
