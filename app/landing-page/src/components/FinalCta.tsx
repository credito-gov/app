import {
  MENSAGEM_CONVERSA,
  MENSAGEM_LISTA,
  linkEmail,
  linkWhatsApp,
} from '../config/contato'
import { useScrollReveal } from '../hooks/useScrollReveal'

export default function FinalCta() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollReveal<HTMLHeadingElement>()
  const { ref: subtitleRef, isVisible: subtitleVisible } = useScrollReveal<HTMLParagraphElement>()
  const { ref: buttonsRef, isVisible: buttonsVisible } = useScrollReveal<HTMLDivElement>()
  const whatsapp = linkWhatsApp(MENSAGEM_CONVERSA.corpo)

  return (
    <section
      id="lista-de-espera"
      className="w-full scroll-mt-[80px] border-t border-[rgba(4,120,87,0.5)] px-6 py-16 md:px-[64px] md:py-[96px]"
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
          Quer ver o seu crédito como caixa?
        </h2>

        <p
          ref={subtitleRef}
          className={`reveal-scale max-w-[520px] text-center text-[16px] text-[#94a3b8] ${subtitleVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '80ms' }}
        >
          O CreditoGov está em desenvolvimento. Entre na lista de espera e acompanhe a primeira
          versão. Empresas e escritórios de contabilidade são bem-vindos.
        </p>

        <div
          ref={buttonsRef}
          className={`reveal-scale flex flex-wrap items-center justify-center gap-4 ${buttonsVisible ? 'is-visible' : ''}`}
          style={{ transitionDelay: '160ms' }}
        >
          <a
            href={linkEmail(MENSAGEM_LISTA)}
            className="rounded-[8px] bg-[#10b981] px-8 py-[14px] text-[15px] font-bold whitespace-nowrap text-[#060a13]"
          >
            Entrar na lista de espera
          </a>
          <a
            href={linkEmail(MENSAGEM_CONVERSA)}
            className="rounded-[8px] border border-white px-8 py-[14px] text-[15px] font-semibold whitespace-nowrap text-white"
          >
            Conversar por e-mail
          </a>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[8px] border border-white px-8 py-[14px] text-[15px] font-semibold whitespace-nowrap text-white"
            >
              Falar pelo WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
