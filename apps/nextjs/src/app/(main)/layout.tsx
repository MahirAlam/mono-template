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
    <>
      <Header />
      <main className="container-xl mx-auto pb-0">{props.children}</main>
      <PostEditorModal />
    </>
  );
}
