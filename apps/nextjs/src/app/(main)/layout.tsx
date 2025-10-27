import { redirect } from "next/navigation";

import Header from "~/components/inc/Header";
import PostEditorModal from "~/components/post/create/editor";
import { getSession } from "~/lib/auth/server";

export default async function MainLayout(props: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return redirect("/auth/sign-in");
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 md:pb-0">{props.children}</main>
      <PostEditorModal />
    </div>
  );
}
