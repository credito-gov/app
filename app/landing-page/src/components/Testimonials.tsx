import avatarPlaceholder from '../assets/avatar-placeholder.png'
import { useScrollReveal } from '../hooks/useScrollReveal'

const TESTIMONIALS = [
  {
    quote:
      'Reduzimos de 3 dias de trabalho manual em planilha para menos de 10 minutos por mês. O crédito que a gente perdia de vista agora aparece no painel.',
    name: 'Fernanda Costa',
    role: 'Controller na Embalagens Sul',
    reveal: 'reveal-left',
  },
  {
    quote:
      'A antecipação de saldo validado nos deu a previsibilidade necessária para manter o fluxo operacional em um momento estratégico de expansão comercial.',
    name: 'Ricardo Nunes',
    role: 'CFO na Distribuidora Master',
    reveal: 'reveal-up',
  },
  {
    quote:
      'Finalmente uma tecnologia que atende a complexidade do contábil e do executivo ao mesmo tempo. A integração com e-CNPJ foi concluída em instantes.',
    name: 'Juliana Prado',
    role: 'Diretora Tributária na Prado & Advogados',
    reveal: 'reveal-right',
  },
] as const

function TestimonialCard({ testimonial }: { testimonial: (typeof TESTIMONIALS)[number] }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`${testimonial.reveal} flex w-full flex-1 flex-col items-start gap-6 rounded-[16px] border border-[#1e293b] bg-[#0e1524] p-8 ${isVisible ? 'is-visible' : ''}`}
    >
      <p className="text-[15px] leading-[1.6] text-[#94a3b8]">“{testimonial.quote}”</p>
      <div className="flex items-center gap-3">
        <img src={avatarPlaceholder} alt="" className="size-8 rounded-full object-cover" />
        <div className="flex flex-col items-start">
          <p className="text-[13px] font-bold whitespace-nowrap text-white">{testimonial.name}</p>
          <p className="text-[11px] whitespace-nowrap text-[#64748b]">{testimonial.role}</p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full bg-[#060a13] px-6 py-16 md:px-[64px] md:py-[96px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-14">
        <div
          ref={headerRef}
          className={`reveal-up flex flex-col items-center gap-4 text-center ${headerVisible ? 'is-visible' : ''}`}
        >
          <div className="rounded-full border border-[rgba(4,120,87,0.5)] bg-[rgba(4,120,87,0.15)] px-3 py-[6px]">
            <p className="text-[11px] font-bold text-[#10b981] uppercase">Feedback Real</p>
          </div>
          <h2 className="text-[36px] font-extrabold text-white">
            O que dizem os nossos clientes
          </h2>
        </div>

        <div className="flex w-full flex-col items-stretch gap-6 md:flex-row">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.name} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
