import "@fontsource-variable/inter";
import "./estilo/tokens.css";
import "./estilo/bundle.css";
import "./estilo/app.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { rotasApp } from "./rotas";
import { ProvedorSessao } from "./sessao/ProvedorSessao";

const roteador = createBrowserRouter(rotasApp);

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <ProvedorSessao>
      <RouterProvider router={roteador} />
    </ProvedorSessao>
  </StrictMode>,
);
