import { Navigate, type RouteObject } from "react-router";
import { LayoutEmpresa } from "./componentes/LayoutEmpresa";
import { AceitarConvite } from "./paginas/AceitarConvite";
import { EscolherEmpresa } from "./paginas/EscolherEmpresa";
import { EsqueciSenha } from "./paginas/EsqueciSenha";
import { Entrar } from "./paginas/Entrar";
import { Inicio } from "./paginas/Inicio";
import { Pessoas } from "./paginas/Pessoas";
import { RedefinirSenha } from "./paginas/RedefinirSenha";
import { RequerSessao, useSessao } from "./sessao/ProvedorSessao";
import { destinoPosLogin } from "./sessao/destino";

// "/": sem sessão vai para /entrar (RequerSessao); com sessão, como em CA-31.
function Raiz() {
  const { estado } = useSessao();
  if (estado.status !== "logada") return null;
  return <Navigate to={destinoPosLogin(estado.empresas)} replace />;
}

export const rotasApp: RouteObject[] = [
  { path: "/entrar", element: <Entrar /> },
  { path: "/esqueci-senha", element: <EsqueciSenha /> },
  { path: "/redefinir-senha", element: <RedefinirSenha /> },
  { path: "/convite", element: <AceitarConvite /> },
  {
    element: <RequerSessao />,
    children: [
      { path: "/", element: <Raiz /> },
      { path: "/empresas", element: <EscolherEmpresa /> },
      {
        path: "/e/:empresaId",
        element: <LayoutEmpresa />,
        children: [
          { index: true, element: <Inicio /> },
          { path: "pessoas", element: <Pessoas /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
