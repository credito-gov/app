import { useState } from 'react'

import logoLockupWhite from '../assets/brand/logo-lockup-white.png'
import { MENSAGEM_LISTA, linkEmail } from '../config/contato'

const NAV_LINKS = [
  { label: 'Como vai funcionar', href: '#como-funciona' },
  { label: 'Prévia do painel', href: '#painel' },
  { label: 'O que vai fazer', href: '#produto' },
  { label: 'Perguntas', href: '#faq' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="nav-enter fixed top-0 right-0 left-0 z-50 h-[80px] border-b border-[#1e293b] bg-[rgba(6,10,19,0.8)] backdrop-blur-[10px]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-[64px]">
        <img src={logoLockupWhite} alt="CreditoGov" className="h-[32px] w-auto" />

        <nav className="hidden items-center gap-[24px] md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-[8px] p-[8px] text-[14px] font-medium whitespace-nowrap text-[#94a3b8]"
            >
              {link.label}
            </a>
          ))}
          <span className="h-[16px] w-px bg-[#1e293b]" />
          <a
            href={linkEmail(MENSAGEM_LISTA)}
            className="text-[14px] font-medium whitespace-nowrap text-[#94a3b8]"
          >
            Lista de espera
          </a>
        </nav>

        <button
          type="button"
          className="flex h-[24px] w-[24px] flex-col items-center justify-center gap-[5px] md:hidden"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="h-[2px] w-full bg-white" />
          <span className="h-[2px] w-full bg-white" />
          <span className="h-[2px] w-full bg-white" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 flex w-full flex-col gap-[20px] border-b border-[#1e293b] bg-[#0e1524] px-6 py-[20px] md:hidden">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-[14px] text-[#94a3b8]">
              {link.label}
            </a>
          ))}
          <a href={linkEmail(MENSAGEM_LISTA)} className="text-[14px] text-[#94a3b8]">
            Lista de espera
          </a>
        </div>
      )}
    </header>
  )
}
