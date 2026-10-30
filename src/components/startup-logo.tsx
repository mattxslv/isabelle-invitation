"use client";

import { useEffect, useState } from "react";
import { MonogramLoader } from "./monogram-loader";

export function StartupLogo() {
  const [stage, setStage] = useState("show");
  useEffect(() => {
    document.documentElement.classList.add("startup-active");
    const fade = window.setTimeout(() => setStage("leave"), 1250);
    const finish = window.setTimeout(() => {
      document.documentElement.classList.remove("startup-active");
      setStage("done");
    }, 1500);
    return () => {
      clearTimeout(fade);
      clearTimeout(finish);
      document.documentElement.classList.remove("startup-active");
    };
  }, []);
  if (stage === "done") return null;
  return <div className={`startup-logo ${stage === "leave" ? "is-leaving" : ""}`}><MonogramLoader /></div>;
}
