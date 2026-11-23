import { useScrollReveal } from '../hooks/useScrollReveal'

export default function FinalCta() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal<HTMLHeadingElement>()
  const { ref: subtitleRef, isVisible: subtitleVisible } = useScrollReveal<HTMLParagraphElement>()
  const { ref: buttonsRef, isVisible: buttonsVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section
      className="w-full border-t border-[rgba(4,120,87,0.5)] px-6 py-16 md:px-[64px] md:py-[96px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(4,120,87,0.302) 0%, rgba(2,44,34,0) 100%), rgb(2,44,34)',
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8">
        <h2
          ref={titleRef}
          className={`reveal-scale text-center text-[40px] font-extrabold tracking-[-0.8px] text-white ${titleVisible ? 'is-visible' : ''}`}
        >
          Descubra quanto crédito você tem parado hoje.
        </h2>

        <p
          ref={subtitleRef}
          className={`reveal-scale max-w-[520px] text-center text-[16px] text-[#94a3b8] ${subtitleVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '80ms' }}
        >
          Não deixe sua empresa perder dinheiro em planilhas fiscais antigas. Integração em
          segundos, resultados no primeiro dia.
        </p>

        <div
          ref={buttonsRef}
          className={`reveal-scale flex flex-wrap items-center justify-center gap-4 ${buttonsVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '160ms' }}
        >
          <a
            href="#testar-gratis"
            className="rounded-[8px] bg-[#10b981] px-8 py-[14px] text-[15px] font-bold whitespace-nowrap text-[#060a13]"
          >
            Testar grátis por 14 dias
          </a>
          <a
            href="#falar-com-especialista"
            className="rounded-[8px] border border-white px-8 py-[14px] text-[15px] font-semibold whitespace-nowrap text-white"
          >
            Falar com especialista
          </a>
        </div>
      </div>
    </section>
  )
}
