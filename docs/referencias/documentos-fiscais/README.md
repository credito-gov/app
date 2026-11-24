# Documentos fiscais: leiaute da chave de acesso

Fontes oficiais do leiaute da chave de 44 posições, usadas pelo painel (`app/painel`, demanda 030) para ler o emitente de uma nota de crédito quando não há recolhimento ligado a ela (D-4 da US). Lidas nos portais oficiais em **2026-11-24**. Este README registra o que as fontes dizem e o que **não** confirmam; o painel não depende do que está em "Não confirmado" e trata esses casos como "emitente não identificado".

## Fontes

| ID | Documento | Versão e data | URL | Seções usadas |
|---|---|---|---|---|
| F-A | "Sistema Nota Fiscal Eletrônica – Manual de Orientação do Contribuinte – Visão Geral" (NF-e e NFC-e, modelos 55 e 65), Portal Nacional da NF-e | MOC 7.0, novembro/2020 | PDF: <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=LrBx7WT9PuA=>; lista: <https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=ndIjl+iEFdE=> | 2.2.6 "Chave de Acesso" (p. 18); 2.2.6.1, Tabela 2-1 (p. 19); 2.2.6.2, DV (p. 19–20); 2.2.8, Tabela 2-4, séries reservadas (p. 21) |
| F-B | "Projeto Conhecimento de Transporte Eletrônico – Manual de Orientação do Contribuinte – Padrões Técnicos de Comunicação do CTe" (modelo 57), Portal Nacional do CT-e | MOC 4.00; capa de agosto/2022, listado no portal como fevereiro/2023 | PDF: <https://www.cte.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=0eu1YksSGXM=>; lista: <https://www.cte.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=YIi+H8VETH0=> | 2.1.4 (p. 8–9); 2.1.6, NFF (p. 9–10); 7.3, DV (p. 78) |
| F-C | "MOC NFCom - Padrões Técnicos de Comunicação" (modelo 62), SVRS | v.1.00a, 11/04/2023 | online: <https://moc.sped.fazenda.pr.gov.br/NFCom/VisaoGeral.html>; lista: <https://dfe-portal.svrs.rs.gov.br/Nfcom/Documentos> | 2.1.3, Tabela 2-1; 5.3, DV |
| F-D | "Nota Técnica Conjunta – CNPJ Alfanumérico – Nota Técnica 2025.001", ENCAT | v1.00, 25/04/2025 | <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=5ZkvIZt10mQ=> | item 4 (p. 7), CNPJ `[A-Z0-9]{12}[0-9]{2}`; item 5 (p. 8), chave `[0-9]{6}[A-Z0-9]{12}[0-9]{26}` e DV com ASCII − 48; produção em 06/07/2026 |
| F-E | Nota Técnica 2026.004 (NF-e) e página "CNPJ alfanumérico" da Receita Federal | NT v1.01, junho/2026 | NT: <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=BTZQzgsO9Ws=>; Receita: <https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico> | produção em 01/07/2026 (NT 2026.004); primeiro CNPJ alfanumérico em 31/07/2026 (Receita) |

## Composição da chave de 44 posições

Ordem e tamanho dos campos, como nas tabelas das fontes. **As posições absolutas são derivadas**: as fontes dão a ordem e o tamanho de cada campo, não uma coluna de posição. A expressão regular da F-D (`[0-9]{6}[A-Z0-9]{12}[0-9]{26}`) confirma a conta nas posições 1–6, 7–18 e 19–44.

| Campo | NF-e, NFC-e, CT-e (F-A, F-B) | NFCom (F-C) | Posições (derivadas) |
|---|---|---|---|
| UF (`cUF`) | 2 | 2 | 1–2 |
| Ano e mês de emissão (`AAMM`) | 4 | 4 | 3–6 |
| CNPJ do emitente (na NF-e e no CT-e, ou CPF precedido de zeros) | 14 | 14 | 7–20 |
| Modelo (`mod`) | 2 | 2 | 21–22 |
| Série | 3 | 3 | 23–25 |
| Número (`nNF`) | 9 | 9 | 26–34 |
| Forma de emissão (`tpEmis`) | 1 | 1 | 35 |
| Código numérico | `cNF`, 8 | `nSiteAutoriz`, 1, e `cNFCom`, 7 | 36–43 |
| Dígito verificador (`cDV`) | 1 | 1 | 44 |

## Regras que o painel usa

| Regra | Fonte e seção |
|---|---|
| Formato da chave: `^[0-9]{6}[A-Z0-9]{12}[0-9]{26}$` (44 posições) | F-D, item 5 |
| Modelo nas posições 21–22 igual ao tipo do documento (55, 57, 62, 65) | F-A, Tabela 2-1; F-B, 2.1.4; F-C, 2.1.3, Tabela 2-1 |
| Dígito verificador: módulo 11, pesos de 2 a 9 da direita para a esquerda sobre as 43 primeiras posições, cada caractere convertido pelo código ASCII menos 48; DV = 11 − resto, e resto 0 ou 1 dá DV 0. Para chave só com dígitos, o resultado é o mesmo do cálculo clássico | F-A, 2.2.6.2; F-B, 7.3; F-C, 5.3; F-D, item 5 (mantém o cálculo e acrescenta a conversão) |
| NFA-e (nota fiscal avulsa), modelo 55, séries de 890 a 899: a chave traz o CNPJ da SEFAZ, não o do remetente | F-A, Tabela 2-4 |
| Série de 910 em diante, modelo 55: reservada para emitente pessoa física; o CPF consta na chave precedido de zeros até completar 14 posições | F-A, 2.2.6.1 e Tabela 2-4 |
| CT-e: a NFF admite CPF do emitente, com zeros à esquerda, mas a chave não traz campo que distinga CPF de CNPJ | F-B, 2.1.6 |
| CNPJ alfanumérico: letras maiúsculas nas posições 7–18 do emitente, desde julho de 2026 | F-D, item 4; F-E |

Como o painel aplica as regras (em ordem; a primeira que falha encerra com "emitente não identificado" e o motivo):

1. Formato de 44 posições.
2. Modelo nas posições 21–22 igual ao `documento` do crédito.
3. Dígito verificador.
4. Modelo 55, série 890–899: não identificado (CNPJ do fisco). Série de 910 em diante: CPF nas posições 10–20 se as posições 7–9 forem `000` e as 10–20 forem 11 dígitos; senão, não identificado. Modelo 65 com série de 890 em diante: não identificado.
5. Modelo 57 com as posições 7–9 iguais a `000`: não identificado (não se distingue CPF de CNPJ). Custo: um CT-e de CNPJ que comece com `000` também cai aqui.
6. Nos demais casos, o emitente são as posições 7–20 (CNPJ, possivelmente com letras). O painel **não confere** o dígito verificador do CNPJ.

A leitura pela chave vale só para os documentos 55, 57, 62 e 65. O documento 91 (NFS-e, chave de 50 posições) e qualquer outro código ficam "emitente não identificado".

## Não confirmado

Entra assim aqui; o painel não depende disso ou trata como "emitente não identificado":

- o leiaute da chave da NFS-e nacional (50 posições, documento 91);
- se a NFC-e admite CPF do emitente ou nota avulsa na chave;
- quais letras são vedadas no CNPJ alfanumérico (o painel aceita `A-Z`, como a expressão da F-D);
- a data exata de produção do CNPJ alfanumérico nos documentos (01/07 na F-E × 06/07/2026 na F-D);
- o texto da IN RFB nº 2.229/2024, que não foi aberto;
- a regra do dígito verificador do CNPJ alfanumérico.

## Evidência observada (não é fonte)

Nos arquivos reais da chamada de 2026-11-24 (ver [`../apuracao-cbs/README.md`](../apuracao-cbs/README.md)), as chaves de 44 posições eram só dígitos, as posições 21–22 repetiam o `documento` e as posições 7–20 tinham o padrão de CNPJ do emitente. É evidência compatível com a regra acima, não fonte dela. Nenhuma chave real aparece neste repositório.
