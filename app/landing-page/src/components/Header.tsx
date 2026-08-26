import { useState } from 'react'

import logoLockup from '../assets/brand/logo-lockup.png'

const NAV_LINKS = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preço', href: '#preco' },
  { label: 'Perguntas', href: '#perguntas' },
]

function Logo() {
  return <img src={logoLockup} alt="CreditoGov" className="h-[32px] w-auto" />
}

function CtaButton({ className = '' }: { className?: string }) {
  return (
    <a
      href="#testar-gratis"
      className={`whitespace-nowrap rounded-[6px] bg-[#10b981] px-[16px] py-[9px] text-[13.5px] font-semibold text-white ${className}`}
    >
      Testar grátis
    </a>
  )
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="relative h-[64px] w-full border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-[48px]">
        <Logo />

        <nav className="hidden items-center gap-[28px] md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="whitespace-nowrap text-[13.5px] text-[#4b5563]"
            >
              {link.label}
            </a>
          ))}
          <a href="#entrar" className="whitespace-nowrap text-[13.5px] font-medium text-[#111827]">
            Entrar
          </a>
          <CtaButton />
        </nav>

        <button
          type="button"
          className="flex h-[24px] w-[24px] flex-col items-center justify-center gap-[5px] md:hidden"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="h-[2px] w-full bg-[#111827]" />
          <span className="h-[2px] w-full bg-[#111827]" />
          <span className="h-[2px] w-full bg-[#111827]" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute top-full left-0 flex w-full flex-col gap-[20px] border-b border-[#e5e7eb] bg-white px-6 py-[20px] md:hidden">
          {NAV_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-[13.5px] text-[#4b5563]">
              {link.label}
            </a>
          ))}
          <a href="#entrar" className="text-[13.5px] font-medium text-[#111827]">
            Entrar
          </a>
          <CtaButton className="text-center" />
        </div>
      )}
    </header>
  )
}
