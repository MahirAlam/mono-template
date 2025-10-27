"use client";

import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth/client";

export default function HomePage() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
          <Button onClick={() => authClient.signOut()}>Logout</Button>
        </h1>
      </div>
    </main>
  );
}
