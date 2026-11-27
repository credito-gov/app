import "@fontsource-variable/inter";
import "./estilo/tokens.css";
import "./estilo/bundle.css";
import "./estilo/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("raiz")!).render(<StrictMode />);
