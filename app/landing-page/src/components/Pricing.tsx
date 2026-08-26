const PLAN_BENEFITS = [
  'Sincronização diária com a Receita Federal',
  'Projeção de crédito para 90 dias',
  'Compensação e antecipação ilimitadas',
  'Suporte prioritário no fechamento do mês',
]

const BONUS_ITEMS = [
  'Diagnóstico retroativo de 60 meses',
  'Onboarding assistido',
  'Revisão fiscal no 1º mês',
]

export default function Pricing() {
  return (
    <section className="w-full bg-white px-6 py-16 md:px-[48px]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[12px] font-semibold tracking-[0.96px] text-[#9ca3af] uppercase">
            Preço
          </p>
          <h2 className="text-[32px] font-semibold tracking-[-0.8px] text-[#111827]">
            Um plano só. Você paga mais quando recupera mais.
          </h2>
          <p className="max-w-[560px] text-[14px] text-[#4b5563]">
            Uma mensalidade fixa mais uma taxa de sucesso sobre o crédito que você efetivamente
            usa.
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[940px] flex-col items-stretch gap-6 md:flex-row">
          <div className="flex flex-col overflow-hidden rounded-[10px] border-[1.5px] border-[#10b981] shadow-[0px_4px_12px_0px_rgba(16,185,129,0.12)] md:w-[536px]">
            <div className="bg-[#ecfdf5] px-6 py-[10px]">
              <p className="text-[11px] font-semibold tracking-[0.44px] text-[#047857]">
                PLANO ÚNICO · CREDITOGOV PRO
              </p>
            </div>

            <div className="flex flex-1 flex-col items-start gap-4 bg-white p-6">
              <div className="flex items-start gap-[6px] text-[#9ca3af]">
                <p className="text-[40px] font-semibold tracking-[-1px]">R$ [valor]</p>
                <p className="text-[16px]">/mês</p>
              </div>

              <hr className="w-[140px] border-t border-[#e5e7eb]" />

              <p className="text-[13px] text-[#9ca3af]">
                + taxa de sucesso de [x]% sobre o crédito usado no mês
              </p>

              <ul className="flex w-full flex-col items-start gap-2">
                {PLAN_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex w-full items-center gap-[10px]">
                    <span className="size-4 shrink-0 rounded-full bg-[#d1fae5]" />
                    <p className="text-[13.5px] text-[#111827]">{benefit}</p>
                  </li>
                ))}
              </ul>

              <a
                href="#testar-gratis"
                className="w-full rounded-[6px] bg-[#10b981] py-[13px] text-center text-[15px] font-semibold text-white"
              >
                Começar os 14 dias grátis
              </a>

              <p className="w-full text-center text-[12px] text-[#6b7280]">
                Sem cartão. Cancele quando quiser, direto no painel.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-[14px] md:flex-1">
            <div className="flex w-full flex-col items-start gap-[6px] rounded-[8px] bg-[#f9fafb] p-5">
              <p className="text-[11px] text-[#9ca3af]">GARANTIA</p>
              <p className="text-[14px] font-semibold text-[#111827]">
                30 dias para achar crédito, ou devolvemos
              </p>
            </div>

            <div className="flex w-full flex-col items-start gap-[10px] rounded-[8px] border border-[#e5e7eb] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#9ca3af]">BÔNUS DE ENTRADA</p>
              {BONUS_ITEMS.map((item) => (
                <div key={item} className="flex w-full items-center gap-2">
                  <span className="size-[14px] shrink-0 rounded-full bg-[#eff6ff]" />
                  <p className="text-[13px] text-[#111827]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
