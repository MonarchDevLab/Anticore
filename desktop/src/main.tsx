import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import TrayQuickPanel from "./views/TrayQuickPanel";
import "./styles/globals.css";
import "./styles/workspace.css";
import "./styles/tool-pages.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif", color: "#ef4444", background: "#0a0a0f", height: "100vh" }}>
          <h2>Arayüz Yüklenirken Bir Hata Oluştu</h2>
          <pre style={{ background: "#1e1e2d", padding: 20, borderRadius: 8, color: "#fff", overflow: "auto" }}>
            {String(this.state.error?.stack || this.state.error?.message)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
          >
            Yeniden Yükle
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [windowLabel, setWindowLabel] = useState<string>("main");

  useEffect(() => {
    const detectWindow = async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const currentWin = getCurrentWindow();
        if (currentWin && currentWin.label) {
          setWindowLabel(currentWin.label);
        }
      } catch {
        const params = new URLSearchParams(window.location.search);
        if (params.get("window") === "quick-panel" || window.location.hash === "#quick-panel") {
          setWindowLabel("quick-panel");
        }
      }
    };
    void detectWindow();
  }, []);

  if (windowLabel === "quick-panel") {
    return <TrayQuickPanel />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);

