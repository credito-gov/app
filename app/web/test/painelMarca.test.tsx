import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PainelMarca } from "../src/componentes/PainelMarca";

const TITULOS = [
  "Veja o crédito de CBS das suas compras, nota a nota.",
  "Saiba o que ainda está a apropriar e de quem vem.",
  "Saiba até quando cada número está atualizado.",
];
const SUBTITULOS = [
  "Quanto a Receita registrou nas notas de compra da sua empresa, num só lugar.",
  "O crédito que a Receita ainda não liberou, agrupado pelo emitente de cada nota.",
  "Os dados vêm da API de apuração da CBS da Receita Federal. O IBS ainda não está nessa fonte.",
];

function movimentoReduzido(reduzido: boolean) {
  window.matchMedia = vi.fn((consulta: string) => ({
    matches: reduzido && consulta.includes("prefers-reduced-motion"),
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function avancar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  movimentoReduzido(false);
});

afterEach(() => {
  vi.useRealTimers();
  // @ts-expect-error remove o simulado para os outros testes
  delete window.matchMedia;
});

describe("PainelMarca (CA-18)", () => {
  it("mostra a primeira mensagem, com título e subtítulo exatos", () => {
    render(<PainelMarca />);
    expect(screen.getByText(TITULOS[0])).toBeInTheDocument();
    expect(screen.getByText(SUBTITULOS[0])).toBeInTheDocument();
    expect(screen.queryByText(TITULOS[1])).toBeNull();
  });

  it("troca a cada 6 segundos, pelas três mensagens, e volta à primeira", () => {
    render(<PainelMarca />);
    avancar(5900);
    expect(screen.getByText(TITULOS[0])).toBeInTheDocument();
    avancar(100);
    expect(screen.getByText(TITULOS[1])).toBeInTheDocument();
    expect(screen.getByText(SUBTITULOS[1])).toBeInTheDocument();
    avancar(6000);
    expect(screen.getByText(TITULOS[2])).toBeInTheDocument();
    expect(screen.getByText(SUBTITULOS[2])).toBeInTheDocument();
    avancar(6000);
    expect(screen.getByText(TITULOS[0])).toBeInTheDocument();
  });

  it("não troca com o ponteiro em cima, e volta a trocar ao sair", () => {
    render(<PainelMarca />);
    const painel = screen.getByTestId("painel-marca");
    fireEvent.mouseEnter(painel);
    avancar(20000);
    expect(screen.getByText(TITULOS[0])).toBeInTheDocument();
    fireEvent.mouseLeave(painel);
    avancar(6000);
    expect(screen.getByText(TITULOS[1])).toBeInTheDocument();
  });

  it("não troca com o foco dentro", () => {
    render(<PainelMarca />);
    const ponto = screen.getByRole("button", { name: "Mensagem 1 de 3" });
    act(() => ponto.focus());
    avancar(20000);
    expect(screen.getByText(TITULOS[0])).toBeInTheDocument();
    act(() => ponto.blur());
    avancar(6000);
    expect(screen.getByText(TITULOS[1])).toBeInTheDocument();
  });

  it("com prefers-reduced-motion: reduce não troca sozinho", () => {
    movimentoReduzido(true);
    render(<PainelMarca />);
    avancar(30000);
    expect(screen.getByText(TITULOS[0])).toBeInTheDocument();
  });

  it("os pontos têm aria-label e aria-current, e o clique troca a mensagem", async () => {
    vi.useRealTimers();
    render(<PainelMarca />);
    const pontos = [1, 2, 3].map((n) => screen.getByRole("button", { name: `Mensagem ${n} de 3` }));
    expect(pontos[0]).toHaveAttribute("aria-current", "true");
    expect(pontos[1]).not.toHaveAttribute("aria-current");
    await userEvent.click(pontos[2]);
    expect(screen.getByText(TITULOS[2])).toBeInTheDocument();
    expect(pontos[2]).toHaveAttribute("aria-current", "true");
    expect(pontos[0]).not.toHaveAttribute("aria-current");
  });

  it("o texto fica numa região aria-live polite", () => {
    render(<PainelMarca />);
    const regiao = document.querySelector('[aria-live="polite"]')!;
    expect(regiao).not.toBeNull();
    expect(regiao).toHaveTextContent(TITULOS[0]);
    expect(regiao).toHaveTextContent(SUBTITULOS[0]);
  });

  it("cartão 1: crédito apurado, valor e selo fictício", () => {
    render(<PainelMarca />);
    expect(screen.getByText("Crédito apurado nas compras")).toBeInTheDocument();
    expect(screen.getByText("R$ 52.121,58")).toBeInTheDocument();
    expect(screen.getByText("896 notas de compra")).toBeInTheDocument();
    expect(screen.getByText("Exemplo fictício")).toBeInTheDocument();
  });

  it("cartão 2: a apropriar por emitente, linhas e selo fictício", () => {
    render(<PainelMarca />);
    avancar(6000);
    expect(screen.getByText("A apropriar, por emitente")).toBeInTheDocument();
    expect(screen.getByText("11.111.111/0001-11")).toBeInTheDocument();
    expect(screen.getByText("R$ 14.320,10")).toBeInTheDocument();
    expect(screen.getByText("22.222.222/0001-22")).toBeInTheDocument();
    expect(screen.getByText("R$ 9.870,45")).toBeInTheDocument();
    expect(screen.getByText("Emitente não identificado")).toBeInTheDocument();
    expect(screen.getByText("R$ 7.950,30")).toBeInTheDocument();
    expect(screen.getByText("Exemplo fictício")).toBeInTheDocument();
  });

  it("cartão 3: data de atualização, fonte e selo Só CBS", () => {
    render(<PainelMarca />);
    avancar(12000);
    expect(screen.getByText("Créditos atualizados em 24/11/2026, 08:12")).toBeInTheDocument();
    expect(screen.getByText("Consulta à API de apuração da CBS da Receita")).toBeInTheDocument();
    expect(screen.getByText("Só CBS")).toBeInTheDocument();
    expect(screen.queryByText("Exemplo fictício")).toBeNull();
  });
});
