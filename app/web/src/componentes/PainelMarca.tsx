import { useEffect, useState, type ReactNode } from "react";
import { Icone } from "./Icone";

// Textos do artboard "Login" aprovado na 032. Valores e data dos cartões são
// fictícios e fixos (P-S3).
const INTERVALO_MS = 6000;

type Mensagem = { titulo: string; subtitulo: string; cartao: ReactNode };

function Barra({ percentual, cor }: { percentual: number; cor: string }) {
  return (
    <div className="marca-barra" aria-hidden="true">
      <div className="marca-barra-valor" style={{ width: `${percentual}%`, background: cor }} />
    </div>
  );
}

function LinhaEmitente({ nome, valor, percentual, cor, apagado = false }: { nome: string; valor: string; percentual: number; cor: string; apagado?: boolean }) {
  return (
    <li className="marca-emitente">
      <div className="marca-emitente-topo">
        <span className={apagado ? "marca-apagado" : "cg-key"}>{nome}</span>
        <span className="cg-money cg-num">{valor}</span>
      </div>
      <Barra percentual={percentual} cor={cor} />
    </li>
  );
}

const MENSAGENS: Mensagem[] = [
  {
    titulo: "Veja o crédito de CBS das suas compras, nota a nota.",
    subtitulo: "Quanto a Receita registrou nas notas de compra da sua empresa, num só lugar.",
    cartao: (
      <div className="cg-total">
        <div className="cg-total-label">Crédito apurado nas compras</div>
        <div className="cg-total-value">R$ 52.121,58</div>
        <div className="marca-rodape">
          <span className="cg-total-note">896 notas de compra</span>
          <span className="cg-badge cg-badge-fict">Exemplo fictício</span>
        </div>
      </div>
    ),
  },
  {
    titulo: "Saiba o que ainda está a apropriar e de quem vem.",
    subtitulo: "O crédito que a Receita ainda não liberou, agrupado pelo emitente de cada nota.",
    cartao: (
      <div className="cg-total is-pending">
        <div className="cg-total-label">
          <Icone nome="relogio" />
          A apropriar, por emitente
        </div>
        <ul className="marca-lista">
          <LinhaEmitente nome="22.222.222/0001-22" valor="R$ 14.320,10" percentual={100} cor="var(--pending)" />
          <LinhaEmitente nome="33.333.333/0001-33" valor="R$ 9.870,45" percentual={69} cor="var(--pending)" />
          <LinhaEmitente nome="Emitente não identificado" valor="R$ 7.950,30" percentual={56} cor="var(--ink-subtle)" apagado />
        </ul>
        <div className="marca-rodape">
          <span className="cg-badge cg-badge-fict">Exemplo fictício</span>
        </div>
      </div>
    ),
  },
  {
    titulo: "Saiba até quando cada número está atualizado.",
    subtitulo: "Os dados vêm da API de apuração da CBS da Receita Federal. O IBS ainda não está nessa fonte.",
    cartao: (
      <div className="cg-total marca-fonte">
        <div className="marca-fonte-linha">
          <span className="marca-fonte-icone">
            <Icone nome="info" grande />
          </span>
          <div>
            <div className="cg-total-label">Créditos atualizados em 24/11/2026, 08:12</div>
            <div className="cg-total-note">Consulta à API de apuração da CBS da Receita</div>
          </div>
        </div>
        <div className="marca-rodape">
          <span className="cg-badge cg-badge-brand">Só CBS</span>
        </div>
      </div>
    ),
  },
];

function prefereMovimentoReduzido(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PainelMarca() {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [reduzido] = useState(prefereMovimentoReduzido);

  useEffect(() => {
    if (pausado || reduzido) return;
    const id = setInterval(() => setIndice((i) => (i + 1) % MENSAGENS.length), INTERVALO_MS);
    return () => clearInterval(id);
  }, [pausado, reduzido, indice]);

  const atual = MENSAGENS[indice];
  return (
    <section
      className="marca"
      data-testid="painel-marca"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <img className="marca-logo" src="/logo.png" alt="CreditoGov" />
      <div className="marca-texto" aria-live="polite">
        <h2 className="marca-titulo">{atual.titulo}</h2>
        <p className="marca-subtitulo">{atual.subtitulo}</p>
      </div>
      <div className="marca-cartao">{atual.cartao}</div>
      <div className="marca-pontos">
        {MENSAGENS.map((_, i) => (
          <button
            key={i}
            type="button"
            className="marca-ponto"
            aria-label={`Mensagem ${i + 1} de ${MENSAGENS.length}`}
            aria-current={i === indice ? "true" : undefined}
            onClick={() => setIndice(i)}
          />
        ))}
      </div>
    </section>
  );
}
