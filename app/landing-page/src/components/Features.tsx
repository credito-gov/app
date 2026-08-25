import iconActions from '../assets/icon-feature-actions.svg'
import iconProjection from '../assets/icon-feature-projection.svg'
import iconSync from '../assets/icon-feature-sync.svg'

const FEATURES = [
  {
    icon: iconSync,
    badgeBg: '#ecfdf5',
    badgeBorder: '#a7f3d0',
    title: 'Sincronização automática com o governo',
    description:
      'Todo dia às 00:05, buscamos suas notas fiscais e cruzamos débitos direto com a Receita Federal via certificado digital.',
    tag: 'Você ganha: zero planilha manual',
    tagColor: '#047857',
  },
  {
    icon: iconProjection,
    badgeBg: '#ecfdf5',
    badgeBorder: '#a7f3d0',
    title: 'Projeção de 90 dias',
    description:
      'Veja não só o que já está validado, mas o que ainda vai entrar de crédito nos próximos três meses.',
    tag: 'Você ganha: previsibilidade de caixa',
    tagColor: '#047857',
  },
  {
    icon: iconActions,
    badgeBg: '#eff6ff',
    badgeBorder: '#bfdbfe',
    title: 'Compensar e antecipar em dois cliques',
    description:
      'Abata um débito de CBS/IBS com o crédito disponível, ou antecipe com uma fintech parceira, sem sair do painel.',
    tag: 'Você ganha: crédito virando caixa rápido',
    tagColor: '#1d4ed8',
  },
]

export default function Features() {
  return (
    <section className="w-full bg-[#f9fafb] px-6 py-16 md:px-[48px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[12px] font-semibold tracking-[0.96px] text-[#9ca3af] uppercase">
            O que você ganha
          </p>
          <h2 className="text-[32px] font-semibold tracking-[-0.8px] text-[#111827]">
            Três coisas que resolvem o mês inteiro
          </h2>
        </div>

        <div className="flex w-full flex-col items-start gap-5 md:flex-row">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex w-full flex-1 flex-col items-start gap-3 rounded-[8px] border border-[#e5e7eb] bg-white p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.06)]"
            >
              <div
                className="flex h-[38px] items-center justify-center rounded-[9px] border px-2"
                style={{ backgroundColor: feature.badgeBg, borderColor: feature.badgeBorder }}
              >
                <img src={feature.icon} alt="" className="size-5" />
              </div>
              <p className="text-[17px] font-semibold text-[#111827]">{feature.title}</p>
              <p className="text-[14px] leading-[1.45] text-[#4b5563]">{feature.description}</p>
              <p className="text-[13px] font-semibold" style={{ color: feature.tagColor }}>
                {feature.tag}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
