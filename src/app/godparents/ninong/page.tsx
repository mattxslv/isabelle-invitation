import type { Metadata } from "next";
import { GodparentExperience } from "@/components/godparent-experience";

export const metadata: Metadata = {
  title: "A little letter from Isabelle",
  description: "A special invitation for Isabelle's Ninong.",
};

export default function NinongPage() {
  return <GodparentExperience mode={{ kind: "role", role: "ninong" }} />;
}
