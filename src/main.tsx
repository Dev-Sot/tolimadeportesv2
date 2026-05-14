import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ErrorBoundary } from "./app/components/shared/ErrorBoundary.tsx";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element found in index.html");

createRoot(root).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
