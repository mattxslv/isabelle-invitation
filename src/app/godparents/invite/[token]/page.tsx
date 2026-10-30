import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GodparentExperience } from "@/components/godparent-experience";
import { getDb } from "@/lib/db";
import { getInviteByToken } from "@/lib/godparents";

export const metadata: Metadata = {
  title: "A little letter from Isabelle",
  description: "A personal invitation from Isabelle.",
  // Personal links must never leak through referrers or indexing.
  referrer: "no-referrer",
};

export default function PersonalInvitePage({ params }: PageProps<"/godparents/invite/[token]">) {
  return (
    <Suspense fallback={<div className="min-h-svh" aria-busy="true" />}>
      <PersonalInvite params={params} />
    </Suspense>
  );
}

async function PersonalInvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) notFound();
  const invite = await getInviteByToken(await getDb(), token);
  if (!invite) notFound();

  return (
    <GodparentExperience
      mode={{
        kind: "invite",
        token: invite.token,
        role: invite.role,
        displayName: invite.displayName,
        previous: invite.response ? { accepted: invite.response.accepted } : null,
      }}
    />
  );
}
