import { useScrollReveal } from '../hooks/useScrollReveal'

const COMPANIES = ['AURORA', 'GLOBAL LOG', 'VALE INDÚSTRIA', 'MATO GROSSO AGRO', 'C-FINANCE']

export default function SocialProof() {
  const { ref: textRef, isVisible: textVisible } = useScrollReveal<HTMLParagraphElement>()
  const { ref: logosRef, isVisible: logosVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <section className="w-full border-y border-[#1e293b] bg-[#0e1524] px-6 py-12 md:px-[64px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
        <p
          ref={textRef}
          className={`reveal-up w-full text-center text-[12px] font-bold text-[#64748b] uppercase ${textVisible ? 'is-visible' : ''}`}
        >
          Mais de 1.840 empresas conectadas no Brasil
        </p>

        <div
          ref={logosRef}
          className={`reveal-up flex w-full flex-wrap items-center justify-between gap-4 ${logosVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '120ms' }}
        >
          {COMPANIES.map((company) => (
            <div
              key={company}
              className="rounded-[8px] border border-[#1e293b] px-4 py-2 text-[14px] font-extrabold whitespace-nowrap text-[#94a3b8]"
            >
              {company}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
