# app/web

Interface do CreditoGov (demanda 034: login e escolha de empresa). React, Vite e TypeScript.

## Comandos

```bash
cd app/web
npm install
npm run dev     # Vite em http://localhost:5173, com proxy de /api para http://127.0.0.1:3000
npm test        # vitest com jsdom; sem rede (o fetch é simulado)
npm run lint
npm run build
```

Para usar a interface de verdade, suba também a API (veja o [README do backend](../backend/README.md)). O proxy do Vite repassa `/api` para a porta 3000 da API e acrescenta `X-Forwarded-For` (`xfwd`); no backend use `CREDITOGOV_CONFIAR_PROXY=loopback` no desenvolvimento (a API só confia no proxy que fala por 127.0.0.1), para o limite por origem enxergar cada pessoa.

## Estados de falha da API

O cliente (`src/api/cliente.ts`) devolve estados tipados; as telas tratam cada um:

| Estado | Quando | O que a pessoa vê |
|---|---|---|
| `sem_conexao` | O `fetch` falhou (sem rede) ou o proxy respondeu 502, 503 ou 504 sem o corpo de erro da API (API parada) | "Sem conexão", com "Tentar de novo" |
| `erro` com código `resposta_invalida` | Resposta de sucesso que não é JSON (exceto 204) | Erro genérico da tela |
| `erro` com código da API | Por exemplo `email_nao_enviado` (502, convite criado e e-mail não enviado) e `convite_aceito_sem_sessao` (500, aceite gravado e sessão não aberta; leva a `/entrar` com o aviso) | A mensagem de cada tela |

Só `401` na leitura inicial da sessão vira "sem sessão"; os demais erros mostram "Tentar de novo". Sair só leva a `/entrar` se o servidor encerrou a sessão.

## Conferência no navegador

Roteiro da conferência do **responsável** (P-9). Só dados fictícios: e-mails de `exemplo.com.br` e raízes de CNPJ `11111111`, `22222222` e `33333333`. O responsável fez a conferência em 2026-11-28, com dados fictícios (handoff da 034, "Verificação"). O roteiro continua aqui para repetir.

1. Subir o banco e migrar, em `app/backend`: `npm run banco:subir` e `npm run migrar`.
2. Com `npm run admin`, criar duas empresas fictícias e convidar um titular e um contador (exemplos em `app/backend/README.md`).
3. Subir a API (`npm run dev` em `app/backend`) e a web (`npm run dev` em `app/web`). Abrir o convite pelo arquivo em `app/backend/.local/emails/`.
4. Conferir:
   - login com sucesso;
   - login com erro (a mensagem não revela se o e-mail existe);
   - sem conexão (parar a API e tentar entrar);
   - muitas tentativas seguidas (aviso de bloqueio temporário);
   - recuperação de senha ("Esqueci a senha" e o link do e-mail em `.local/emails/`);
   - aceitar convite sem conta (criar a senha) e com conta (entrar e aceitar);
   - escolha de empresa e troca de empresa;
   - lista de pessoas, remoção de vínculo e sair.
5. Repetir em largura de celular (por volta de 375 px) e de desktop, e com `prefers-reduced-motion` ligado.

## Conferência no navegador: dashboard (demanda 033)

Roteiro para o **responsável** executar antes do PR. Só dados fictícios. **Ainda não foi feita**; o resultado fica registrado no PR. O Developer não abriu o navegador: rodou só os testes (`npm test`) e o build.

1. Em `app/backend`: `npm run banco:subir`, `npm run migrar` (aplica a `0002`), e crie uma empresa por cenário com `npm run admin -- criar-empresa` (raízes fictícias diferentes, por exemplo `31000001` a `31000009`), convide a mesma pessoa para todas e aceite os convites pelo e-mail local. Carregue um cenário em cada empresa com `npm run admin -- carregar-cenario --empresa <id> --cenario <nome>` (ver `app/backend/README.md`).
2. Suba a API e a web (`npm run dev` nas duas pastas) e entre com essa pessoa.
3. Em **largura de desktop**, abra cada empresa e compare com os artboards "Dashboard" e "Dashboard — estados dos dados" da 032:
   - `completo`: os cinco cartões (apurado, a apropriar, apropriado, já utilizado, saldo credor), cada um com o nome oficial do campo; "Pendente por emitente" com "Demais emitentes", "Emitente não identificado" e a frase do percentual; evolução por período em tabela; bloco de débitos separado e abaixo; aviso de só CBS. Troque o período no seletor e confira a URL (`?periodo=AAAA-MM`) e que todos os blocos acompanham.
   - `sem-consulta`, `em-andamento`, `vazio`, `parcial`, `falha-com-anteriores`, `desatualizado`, `recusado` e `outros-valores`: o estado de cada um, como na tabela do `app/backend/README.md`. Nenhum `R$ 0,00` no lugar de dado que não existe.
   - "Ver todos os emitentes", e o clique em cada linha, levam à lista e às notas do grupo (100 por página, com o período preservado).
   - Nenhuma tela usa "disponível", "pode usar", "confirmado", "a receber", "garantido" nem diz que alguém deixou de recolher.
4. Repita com a **janela estreita** (por volta de 600 px): os blocos se empilham, sem desenho próprio para celular.
5. Confira o menu: "Visão geral", "Pendências" e "Pessoas", e nada de "Créditos", "Débitos" ou "Consultas à Receita".
6. **Carteira** (`/empresas`): com a mesma pessoa ligada a **todas** as empresas de cenário, abra `/empresas` e compare com o artboard "Carteira do contador" da 032, em largura de desktop e com a janela estreita:
   - uma linha por empresa, com nome, CNPJ raiz e papel (texto secundário abaixo do nome), "A apropriar (pendente)", "Apropriado" e "Já utilizado" com o nome oficial do campo no cabeçalho, selo e data da última consulta;
   - `completo`: valores e selo "Atualizado"; `falha-com-anteriores`: valores e selo "Consulta falhou"; `desatualizado`: "N dias sem consulta"; `sem-consulta` e `em-andamento`: "Sem consulta concluída" e o texto do estado no lugar dos valores, sem `R$ 0,00`; `vazio` e `recusado`: o texto do estado;
   - ordene por nome (padrão), por "A apropriar (pendente)" (as sem valor no fim) e por "Última consulta" (as sem consulta concluída primeiro);
   - o clique em qualquer parte da linha abre a Visão geral da empresa, com os valores dela;
   - não há total, cartão de soma nem rodapé: o subtítulo lembra que valores de empresas diferentes não se somam.
