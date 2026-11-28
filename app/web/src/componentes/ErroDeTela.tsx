// Tela de erro inesperado na área logada: texto simples e um caminho de volta, sem o detalhe do erro.
import { Link } from "react-router";
import { TEXTOS } from "../paineis/textos";
import { Alerta } from "./Alerta";

export function ErroDeTela() {
  const t = TEXTOS.erroDeTela;
  return (
    <main className="pagina-carteira">
      <div className="pagina-carteira-corpo">
        <Alerta tipo="error" titulo={t.titulo}>
          {t.orientacao}
        </Alerta>
        <Link className="cg-link" to="/empresas">
          {t.voltar}
        </Link>
      </div>
    </main>
  );
}
