import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { apiMode } from "./services/mode";
import { readSession } from "./services/session";
import { loadWorkspace } from "./services/sync";

const queryClient = new QueryClient();

function Root() {
  // A temporary-password login may only reach the change-password screen until it picks its own password,
  // so the desk data is not requested for it yet (the API refuses those calls until then).
  const mustChange = !!readSession()?.user.mustChangePassword;
  const [ready, setReady] = useState(!apiMode || !readSession() || mustChange);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!apiMode || !readSession() || mustChange) return;
    loadWorkspace().then(() => setReady(true)).catch(() => setFailed(true));
  }, []);
  if (failed) return <div className="grid h-screen place-items-center bg-canvas px-6 text-center text-ink">The desk could not be loaded. Refresh to try again.</div>;
  if (!ready) return <div className="h-screen bg-canvas" />;
  return <QueryClientProvider client={queryClient}><App /></QueryClientProvider>;
}

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Root />);
}