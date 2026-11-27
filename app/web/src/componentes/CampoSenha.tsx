import { useState } from "react";
import { Campo, descricaoDoCampo } from "./Campo";
import { Icone } from "./Icone";

type Props = {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  autoComplete?: string;
  erro?: string;
  ajuda?: string;
  desabilitado?: boolean;
};

export function CampoSenha({ id, rotulo, valor, aoMudar, autoComplete, erro, ajuda, desabilitado }: Props) {
  const [visivel, setVisivel] = useState(false);
  return (
    <Campo id={id} rotulo={rotulo} erro={erro} ajuda={ajuda}>
      <div className="cg-control">
        <input
          id={id}
          className="cg-input has-trail"
          type={visivel ? "text" : "password"}
          value={valor}
          autoComplete={autoComplete}
          disabled={desabilitado}
          onChange={(e) => aoMudar(e.target.value)}
          {...descricaoDoCampo(id, erro, ajuda)}
        />
        <button
          type="button"
          className="cg-trail"
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          onClick={() => setVisivel((v) => !v)}
        >
          <Icone nome={visivel ? "olhoRiscado" : "olho"} />
        </button>
      </div>
    </Campo>
  );
}
