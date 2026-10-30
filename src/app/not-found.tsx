import Link from "next/link";
import { HeartRule } from "@/components/ornaments";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[26rem] flex-col items-center justify-center px-6 text-center">
      <p className="script gold-text px-2 pb-1 text-5xl leading-[1.2]">Oh dear</p>
      <HeartRule className="mt-1" />
      <p className="prose-soft mt-4">This link isn&rsquo;t quite right, or it&rsquo;s no longer active.</p>
      <Link href="/" className="btn btn-primary mt-6">
        Open the invitation
      </Link>
    </main>
  );
}
