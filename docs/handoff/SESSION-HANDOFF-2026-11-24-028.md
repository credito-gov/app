# Handoff — 2026-11-24 — demanda 028-revisao-texto-landing

## O que foi entregue

A landing (`app/landing-page`) passou para a postura de pré-lançamento, mantendo o visual do redesign escuro:

- diz que o produto está em desenvolvimento, explica o problema e o que ele vai fazer, e convida para a lista de espera;
- saíram as seções Prova Social, Métricas, Depoimentos e Preço (`SocialProof.tsx`, `Metrics.tsx`, `Testimonials.tsx`, `Pricing.tsx`, `avatar-placeholder.png` e a classe CSS `.reveal-scale-bounce`);
- saíram as promessas sem base: integração com Receita/e-CAC/e-CNPJ, teste grátis, compensar e antecipar, fintechs, regras tributárias sem fonte, números e clientes;
- a única regra tributária usada é a do Manual de Operações do Split Payment (Apêndice A): o crédito depende da extinção do débito do fornecedor;
- os mockups trazem "Exemplo ilustrativo", separam crédito confirmado de pendente e não têm botão de compensar;
- a primeira versão é apresentada como "começa pela CBS", e o IBS só como etapa futura (decisão 4, depois do PR #26);
- os botões levam a e-mail e WhatsApp, configurados num único ponto: `src/config/contato.ts`;
- o menu e o rodapé apontam só para seções existentes (`#como-funciona`, `#painel`, `#produto`, `#faq`, `#lista-de-espera`); o menu do celular fecha ao tocar num item;
- `index.html`, `robots.txt` e `sitemap.xml` usam `https://credito-gov.vercel.app`.

Especificação: [`us.md`](../demandas/028-revisao-texto-landing/us.md) (CA-1 a CA-25), [`spec.md`](../demandas/028-revisao-texto-landing/spec.md) e [`tasks.md`](../demandas/028-revisao-texto-landing/tasks.md) (tasks 1 a 25, com o registro de verificação).

## Verificação

A landing não tem testes automatizados. A verificação foi:

- busca de termos proibidos do CA-20 (comando no `spec.md`): 65 linhas antes, nenhuma depois;
- busca de IBS (CA-24/CA-25): só as ocorrências permitidas pela Spec;
- `npm run lint` e `npm run build` sem erro;
- conferência no navegador em 1280 px e 375 px, sem rolagem horizontal, com os botões de contato conferidos.

Revisão: três rodadas de revisão. A rodada 1 foi reprovada (rolagem horizontal em 375 px, contraste do selo do Hero, menu do celular, CSS morto). Na rodada 2 houve aprovação, com o contato ainda pendente. A revisão final, depois do contato e do ajuste "começa pela CBS", aprovou.

## Pendências

- **Publicação:** o site não vai ao ar com o merge. O Vercel recusa publicar a partir do repositório (item próprio no backlog).
- **Contato:** o e-mail e o WhatsApp gravados são pessoais, informados pelo responsável. Trocar por um canal comercial é só mudar `src/config/contato.ts`.
- **Nada valida o formato do contato:** decidiu-se conferir à mão, sem validação no build. Se o contato mudar, confira os botões no navegador.
- `overflow-x-clip` no Hero não funciona em Safari anterior à versão 16. Nesses navegadores volta uma rolagem horizontal de 8 px durante a animação de entrada.
- O texto público fica para revisar de novo quando a fonte de dados (acesso multi-cliente) e o IBS se definirem.

## Onde retomar

Depois do merge: gravar o status `concluída` e o `flow-evaluation.md` da demanda, e remover o worktree `.claude/worktrees/028-revisao-texto-landing`.
