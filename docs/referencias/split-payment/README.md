# Split Payment — manuais oficiais

Material publicado pelo governo para a Plataforma Pública de Split Payment. Os `.pdf` são os originais; os `.txt` são a extração do texto, para busca.

| Arquivo | O que é |
|---|---|
| `Split Payment - Manual de Operações.pdf` / `Manual de Operações.txt` | Regras de operação. Versão preliminar, junho de 2026 |
| `Split Payment - Manual de Integração.pdf` / `Manual de Integração.txt` | Especificação da API. Versão 1.0 |
| `Split Payment - Manual de Tempos.pdf` / `Manual de Tempos.txt` | Prazos e janelas operacionais |
| `openapi-v0_0_10.json` | OpenAPI da plataforma, versão 0.0.10, marcada como "em construção" |

Os manuais citam outros que **não estão aqui**: Redes, Segurança, Onboarding e o Regulamento (Ato Conjunto RFB/CGIBS).

## O que estes documentos dizem

Conferido em 2026-11-23. Entre parênteses, onde está.

- **Para quem é a plataforma.** É um hub entre os PSPs (bancos, instituições de pagamento, Núclea) e o governo (RFB e CGIBS). Não implementa regra de negócio de arrecadação nem de apuração. (Integração, §1 e §2)
- **Autenticação.** mTLS com certificado de cliente. Não há OAuth2. (OpenAPI, `securitySchemes`)
- **O que a API tem.** Informes de transação iniciada, atualizada, baixa, pagamento e segregação, por arranjo (boleto, Pix dinâmico, Pix automático, Pix estático, TED, TEF), e o "Retorno Super Inteligente" para o PSP, identificado por `idPsp`. (OpenAPI, `paths`)
- **O que a API não tem.** Nenhum endpoint de consulta de créditos ou débitos por CNPJ de contribuinte.
- **Fase 1 é "B2B Opcional".** Vale para operações entre pessoas jurídicas. Usar o split é facultativo para quem origina a transação; implementar é obrigatório para os PSPs. (Operações, §1.2)
- **Fora do escopo da Fase 1.** Recolhimento pelo adquirente, pagamento pelo contribuinte e compensação de créditos. (Operações, §1.2)
- **Crédito tributário.** Direito do adquirente pessoa jurídica no regime regular. Exige o destaque de CBS/IBS no documento fiscal e a extinção do débito do fornecedor, por split, recolhimento pelo adquirente ou outra modalidade. (Operações, Apêndice A)
- **Vínculo com o documento fiscal.** O documento fiscal informado na transação liga o pagamento à operação. É esse vínculo que permite extinguir o débito do fornecedor e liberar o crédito do adquirente. (Operações, §3)
- **Responsabilidade.** A obrigação tributária continua com o contribuinte; o PSP não é responsável solidário. (Operações, §7.1)

## O que isso significa para o CreditoGov

A concepção do projeto assumiu uma "API da Receita Federal" com OAuth2 e endpoints `/apuracao-creditos/{cnpj}`, `/apuracao-debitos/{cnpj}` e `/consulta-retorno`. **Isso não existe nestes documentos.** O CreditoGov não é PSP e não tem como consumir esta plataforma.

Os dados de crédito vêm de outro lugar: as APIs de apuração da CBS, descritas em [`../apuracao-cbs/README.md`](../apuracao-cbs/README.md).
