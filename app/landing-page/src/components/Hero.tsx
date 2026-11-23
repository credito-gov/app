import heroChart from '../assets/hero-chart.svg'
import { MENSAGEM_CONVERSA, MENSAGEM_LISTA, linkEmail } from '../config/contato'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function Hero() {
  const { ref: leftRef, isVisible: leftVisible } = useScrollReveal<HTMLDivElement>()
  const { ref: mockupRef, isVisible: mockupVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section
      className="w-full px-6 pt-[88px] pb-16 md:px-[64px] md:pb-[96px]"
      style={{
        background:
          'radial-gradient(ellipse 900px 500px at 85% 10%, rgba(4,120,87,0.15), transparent 60%), #060a13',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 md:flex-row md:gap-[40px]">
        <div
          ref={leftRef}
          className={`reveal-left flex flex-1 flex-col items-start gap-6 ${leftVisible ? 'is-visible' : ''}`}
        >
          <div className="flex items-center gap-[6px] rounded-full border border-[rgba(4,120,87,0.5)] bg-[rgba(4,120,87,0.15)] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#10b981] uppercase">
              Em desenvolvimento · CBS/IBS
            </p>
          </div>

          <h1 className="text-[48px] leading-[1.15] font-extrabold tracking-[-1.44px] text-white">
            Pare de deixar crédito tributário parado na planilha.
          </h1>

          <p className="max-w-[480px] text-[16px] leading-[1.6] text-[#94a3b8]">
            Com a CBS e o IBS, as compras da sua empresa geram crédito, mas ele só pode ser usado
            quando o imposto do fornecedor é quitado. O CreditoGov está em desenvolvimento para
            mostrar quanto do seu crédito já está confirmado, quanto ainda depende do fornecedor e
            de quais compras ele vem.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={linkEmail(MENSAGEM_LISTA)}
              className="rounded-[8px] bg-[#10b981] px-7 py-[14px] text-[15px] font-bold whitespace-nowrap text-[#060a13]"
            >
              Entrar na lista de espera
            </a>
            <a
              href={linkEmail(MENSAGEM_CONVERSA)}
              className="rounded-[8px] border border-[#1e293b] bg-[rgba(255,255,255,0.02)] px-7 py-[14px] text-[15px] font-semibold whitespace-nowrap text-white"
            >
              Conversar com a equipe
            </a>
          </div>

          <p className="text-[12px] text-[#64748b]">
            Lista de espera sem custo e sem compromisso. Avisaremos quando a primeira versão estiver
            pronta.
          </p>
        </div>

        <div
          ref={mockupRef}
          className={`reveal-right w-full flex-1 overflow-hidden rounded-[16px] border border-[#1e293b] bg-[#0e1524] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.08)] ${mockupVisible ? 'is-visible' : ''}`}
        >
          <div className="flex w-full items-center gap-[6px] border-b border-[#1e293b] bg-[#0c121e] px-5 py-3">
            <span className="size-2 rounded-full bg-[#1e293b]" />
            <span className="size-2 rounded-full bg-[#1e293b]" />
            <span className="size-2 rounded-full bg-[#1e293b]" />
            <span className="flex-1" />
            <p className="text-[11px] font-semibold whitespace-nowrap text-[#94a3b8]">
              EXEMPLO ILUSTRATIVO
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-5 p-7">
            <div className="flex flex-col items-start gap-1">
              <p className="text-[11px] font-bold text-[#64748b]">
                Crédito confirmado (CBS + IBS)
              </p>
              <p className="text-[38px] font-extrabold text-white">R$ 152.430,18</p>
            </div>

            <div className="flex w-full items-start gap-4">
              <div className="flex flex-1 flex-col items-start gap-1 rounded-[8px] border border-[rgba(5,150,105,0.2)] bg-[rgba(5,150,105,0.08)] p-4">
                <p className="text-[12px] font-semibold text-[#10b981]">
                  Fornecedores com pendência
                </p>
                <p className="text-[18px] font-bold text-white">7</p>
              </div>
              <div className="flex flex-1 flex-col items-start gap-1 rounded-[8px] border border-[rgba(217,119,6,0.2)] bg-[rgba(217,119,6,0.08)] p-4">
                <div className="flex items-center gap-2">
                  <span className="size-[14px] rounded-full bg-[#fbbf24]" />
                  <p className="text-[12px] font-semibold text-[#fbbf24]">Pendente</p>
                </div>
                <p className="text-[18px] font-bold text-white">R$ 121.905,40</p>
              </div>
            </div>

            <img src={heroChart} alt="" className="h-[90px] w-full" />

            <div className="flex w-full items-center justify-between gap-3 rounded-[12px] bg-[#047857] p-4">
              <div className="flex min-w-0 flex-col items-start gap-[2px]">
                <p className="text-[13px] font-bold text-white">
                  Maior pendência: Fornecedor A
                </p>
                <p className="text-[11px] text-white/80">
                  R$ 48.300,00 aguardando o fornecedor
                </p>
              </div>
              <span className="shrink-0 rounded-[6px] bg-white px-4 py-2 text-[12px] font-bold whitespace-nowrap text-[#047857]">
                Ver notas
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
