import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Family sign in",
  referrer: "no-referrer",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[26rem] flex-col justify-center px-6 py-12">
      <p className="eyebrow text-center">Isabelle&rsquo;s family</p>
      <h1 className="heading mt-2 text-center">Sign in</h1>
      <p className="prose-soft mt-3 text-center">RSVPs and godparent replies are private to the family.</p>
      <div className="card mt-8 px-6 py-7">
        <LoginForm />
      </div>
    </main>
  );
}
