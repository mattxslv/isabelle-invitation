"use client";

import { useEffect, useState } from "react";
import { MonogramLoader } from "./monogram-loader";

export function StartupLogo() {
  const [stage, setStage] = useState("show");
  useEffect(() => {
    const root = document.documentElement;
    const resetTop = root.dataset.reloadTop === "true";
    const previousRestoration = root.dataset.previousScrollRestoration === "manual" ? "manual" : "auto";
    const finishScrollReset = () => {
      if (!resetTop) return;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      history.scrollRestoration = previousRestoration;
      delete root.dataset.reloadTop;
      delete root.dataset.previousScrollRestoration;
    };
    if (resetTop) {
      history.scrollRestoration = "manual";
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    document.documentElement.classList.add("startup-active");
    const fade = window.setTimeout(() => setStage("leave"), 750);
    const finish = window.setTimeout(() => {
      finishScrollReset();
      document.documentElement.classList.remove("startup-active");
      setStage("done");
    }, 1000);
    return () => {
      clearTimeout(fade);
      clearTimeout(finish);
      document.documentElement.classList.remove("startup-active");
      if (resetTop) history.scrollRestoration = previousRestoration;
    };
  }, []);
  if (stage === "done") return null;
  return <div className={`startup-logo ${stage === "leave" ? "is-leaving" : ""}`}><MonogramLoader /></div>;
}
