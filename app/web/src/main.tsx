import "@fontsource-variable/inter";
import "./estilo/tokens.css";
import "./estilo/bundle.css";
import "./estilo/app.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { criarClienteDeCache } from "./paineis/busca";
import { rotasApp } from "./rotas";
import { ProvedorSessao } from "./sessao/ProvedorSessao";

const roteador = createBrowserRouter(rotasApp);
const clienteDeCache = criarClienteDeCache();

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <QueryClientProvider client={clienteDeCache}>
      <ProvedorSessao>
        <RouterProvider router={roteador} />
      </ProvedorSessao>
    </QueryClientProvider>
  </StrictMode>,
);
