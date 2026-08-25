import avatarPlaceholder from '../assets/avatar-placeholder.png'

const TESTIMONIALS = [
  {
    quote:
      'Reduzimos 3 dias de planilha para 10 minutos por mês. O crédito que a gente perdia de vista agora aparece sozinho.',
    name: 'Fernanda Costa',
    role: 'Controller — Indústria de Embalagens',
  },
  {
    quote:
      'A antecipação via fintech resolveu um aperto de caixa que a gente ia sentir por dois meses.',
    name: 'Ricardo Nunes',
    role: 'CFO — Distribuidora de Insumos',
  },
  {
    quote: 'Finalmente um painel que fala a língua do contador e do financeiro ao mesmo tempo.',
    name: 'Juliana Prado',
    role: 'Contadora — Escritório Contábil',
  },
]

const LOGO_SLOT_COUNT = 6

export default function SocialProof() {
  return (
    <section className="flex w-full flex-col items-center gap-6 border-b border-[#e5e7eb] bg-white px-6 py-[34px] md:px-[48px]">
      <p className="w-full text-center text-[12px] font-semibold tracking-[0.96px] text-[#9ca3af] uppercase">
        Usado por empresas que já recuperaram milhões em crédito
      </p>

      <div className="flex w-full flex-wrap items-start gap-4">
        {Array.from({ length: LOGO_SLOT_COUNT }).map((_, index) => (
          <div
            key={index}
            className="h-[34px] min-w-[100px] flex-1 rounded-[6px] border border-dashed border-[#d1d5db]"
          />
        ))}
      </div>

      <div className="flex w-full flex-col items-start gap-4 md:flex-row">
        {TESTIMONIALS.map((testimonial) => (
          <div
            key={testimonial.name}
            className="flex w-full flex-1 flex-col items-start gap-4 rounded-[8px] border border-[#e5e7eb] bg-white p-5"
          >
            <p className="text-[14px] leading-[1.55] text-[#111827]">“{testimonial.quote}”</p>
            <div className="flex items-center gap-[10px]">
              <img
                src={avatarPlaceholder}
                alt=""
                className="size-8 rounded-full object-cover"
              />
              <div className="flex flex-col items-start">
                <p className="text-[12.5px] font-semibold whitespace-nowrap text-[#111827]">
                  {testimonial.name}
                </p>
                <p className="text-[11.5px] whitespace-nowrap text-[#6b7280]">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="w-full text-center text-[11.5px] text-[#9ca3af]">
        Logos, números e depoimentos acima são placeholders de exemplo — substituir por clientes e
        resultados reais antes da publicação.
      </p>
    </section>
  )
}
