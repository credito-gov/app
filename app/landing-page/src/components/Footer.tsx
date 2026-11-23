import logoLockupWhite from '../assets/brand/logo-lockup-white.png'
import { useScrollReveal } from '../hooks/useScrollReveal'

const COLUMNS = [
  {
    title: 'Produto',
    links: ['Como funciona', 'Preço', 'Dashboard', 'Segurança'],
  },
  {
    title: 'Soluções',
    links: ['Antecipação', 'Compensação', 'Previsões', 'e-CNPJ'],
  },
  {
    title: 'Suporte',
    links: ['FAQ', 'Central de Ajuda', 'WhatsApp', 'Contato'],
  },
]

export default function Footer() {
  const { ref: columnsRef, isVisible: columnsVisible } = useScrollReveal<HTMLDivElement>()
  const { ref: bottomRef, isVisible: bottomVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <footer className="w-full border-t border-[#1e293b] bg-[#040810] px-6 pt-12 pb-8 md:px-[64px] md:pt-[64px] md:pb-[40px]">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-12">
        <div
          ref={columnsRef}
          className={`reveal flex w-full flex-col items-start gap-10 md:flex-row md:justify-between ${columnsVisible ? 'is-visible' : ''}`}
        >
          <div className="flex flex-col items-start gap-4">
            <img src={logoLockupWhite} alt="CreditoGov" className="h-[32px] w-auto" />
            <p className="max-w-[280px] text-[13px] leading-[1.55] text-[#94a3b8]">
              Auditoria de crédito fiscal CBS/IBS com atualização diária via Receita Federal.
            </p>
          </div>

          <div className="flex flex-wrap items-start gap-x-16 gap-y-8">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col items-start gap-3">
                <p className="text-[11px] font-bold tracking-[0.6px] text-white uppercase">
                  {column.title}
                </p>
                {column.links.map((link) => (
                  <p key={link} className="text-[13px] whitespace-nowrap text-[#94a3b8]">
                    {link}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          ref={bottomRef}
          className={`reveal flex w-full flex-col items-start gap-2 border-t border-[#1e293b] pt-6 text-[12px] text-[#64748b] md:flex-row md:items-center md:justify-between ${bottomVisible ? 'is-visible' : ''}`}
        >
          <p>© 2026 CreditoGov. Todos os direitos reservados.</p>
          <p>Auditoria tributária, todo santo dia.</p>
        </div>
      </div>
    </footer>
  )
}
