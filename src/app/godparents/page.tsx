import type { Metadata } from "next";
import { GodparentExperience } from "@/components/godparent-experience";

export const metadata: Metadata = {
  title: "A little letter from Isabelle",
  description: "A special invitation for Isabelle's Ninong or Ninang.",
};

export default function GodparentsPage() {
  return <GodparentExperience mode={{ kind: "generic" }} />;
}
