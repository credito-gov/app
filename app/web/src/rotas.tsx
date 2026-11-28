import { Navigate, type RouteObject } from "react-router";
import { ErroDeTela } from "./componentes/ErroDeTela";
import { LayoutEmpresa } from "./componentes/LayoutEmpresa";
import { AceitarConvite } from "./paginas/AceitarConvite";
import { Carteira } from "./paginas/Carteira";
import { EsqueciSenha } from "./paginas/EsqueciSenha";
import { Entrar } from "./paginas/Entrar";
import { NotasDoGrupo } from "./paginas/NotasDoGrupo";
import { Pendencias } from "./paginas/Pendencias";
import { Pessoas } from "./paginas/Pessoas";
import { VisaoGeral } from "./paginas/VisaoGeral";
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
    errorElement: <ErroDeTela />,
    children: [
      { path: "/", element: <Raiz /> },
      { path: "/empresas", element: <Carteira /> },
      {
        path: "/e/:empresaId",
        element: <LayoutEmpresa />,
        children: [
          { index: true, element: <VisaoGeral /> },
          { path: "pendencias", element: <Pendencias /> },
          { path: "pendencias/:grupo", element: <NotasDoGrupo /> },
          { path: "pessoas", element: <Pessoas /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
];
