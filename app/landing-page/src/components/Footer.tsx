import logoLockupWhite from '../assets/brand/logo-lockup-white.png'

const COLUMNS = [
  {
    title: 'PRODUTO',
    links: ['Como funciona', 'Preço', 'Segurança', 'Para contadores'],
  },
  {
    title: 'EMPRESA',
    links: ['Sobre', 'Blog', 'Central de ajuda', 'Contato'],
  },
  {
    title: 'LEGAL',
    links: ['Termos de uso', 'Política de privacidade', 'LGPD', 'Status do sistema'],
  },
]

export default function Footer() {
  return (
    <footer className="w-full bg-[#111827] px-6 pt-11 pb-[30px] md:px-[48px]">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8">
        <div className="flex w-full flex-col items-start gap-8 md:flex-row">
          <div className="flex flex-1 flex-col items-start gap-[10px]">
            <img src={logoLockupWhite} alt="CreditoGov" className="h-[32px] w-auto" />
            <p className="w-[240px] text-[13.5px] leading-[1.55] text-[#9ca3af]">
              Apuração automática de crédito tributário de CBS/IBS para indústrias e
              distribuidoras.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-1 flex-col items-start gap-[10px]">
              <p className="text-[12px] font-semibold tracking-[0.6px] text-white">
                {column.title}
              </p>
              {column.links.map((link) => (
                <p key={link} className="text-[13px] whitespace-nowrap text-[#9ca3af]">
                  {link}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col items-start gap-2 border-t border-white/10 pt-5 text-[12px] text-[#9ca3af] md:flex-row md:items-center md:justify-between">
          <p>© 2026 CreditoGov. Todos os direitos reservados.</p>
          <p>Crédito tributário, todo santo dia.</p>
        </div>
      </div>
    </footer>
  )
}
