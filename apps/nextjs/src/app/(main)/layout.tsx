import { redirect } from "next/navigation";

import { getSession } from "~/lib/auth/server";

export default async function MainLayout(props: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return redirect("/sign-in");
  }

  return <>{props.children}</>;
}
