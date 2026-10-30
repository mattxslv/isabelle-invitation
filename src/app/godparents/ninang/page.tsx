import type { Metadata } from "next";
import { GodparentExperience } from "@/components/godparent-experience";

export const metadata: Metadata = {
  title: "A little letter from Isabelle",
  description: "A special invitation for Isabelle's Ninang.",
};

export default function NinangPage() {
  return <GodparentExperience mode={{ kind: "role", role: "ninang" }} />;
}
