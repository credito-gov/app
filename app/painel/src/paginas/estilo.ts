// Folha de estilo servida em /estilo.css (D-8). Escrita à mão, sem framework e sem fonte externa:
// as variáveis vêm das cores do tema escuro da landing (app/landing-page/src).
// Fica num módulo TypeScript para o build (tsc) levá-la para dist/ sem etapa de cópia.
export const ESTILO = `:root {
  --fundo: #060a13;
  --superficie: #0e1524;
  --superficie-2: #111827;
  --borda: #1e293b;
  --texto: #e2e8f0;
  --texto-2: #94a3b8;
  --texto-3: #64748b;
  --destaque: #10b981;
  --destaque-escuro: #047857;
  --alerta: #fbbf24;
  --fonte: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--fundo);
  color: var(--texto);
  font-family: var(--fonte);
  font-size: 15px;
  line-height: 1.5;
  min-width: 1280px;
}

a { color: var(--destaque); text-decoration: none; }
a:hover { text-decoration: underline; }

.topo {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 14px 32px;
  background: var(--superficie);
  border-bottom: 1px solid var(--borda);
}
.marca { font-weight: 700; color: var(--destaque); font-size: 17px; }
.topo nav { display: flex; gap: 20px; }
.topo nav a { color: var(--texto-2); padding: 4px 0; border-bottom: 2px solid transparent; }
.topo nav a.ativo, .topo nav a:hover { color: var(--texto); border-bottom-color: var(--destaque); text-decoration: none; }
.contexto { margin-left: auto; display: flex; gap: 24px; color: var(--texto-2); font-size: 13px; }
.contexto strong { color: var(--texto); }

main { padding: 24px 32px 64px; max-width: 1600px; }
h1 { font-size: 24px; margin: 0 0 16px; }
h2 { font-size: 18px; margin: 0 0 8px; }
h3 { font-size: 15px; margin: 12px 0 4px; }

.bloco {
  background: var(--superficie);
  border: 1px solid var(--borda);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 0 0 20px;
  overflow-x: auto;
}
.nota { color: var(--texto-2); font-size: 13px; margin: 4px 0 12px; }
.so-cbs { color: var(--alerta); font-weight: 600; margin: 0 0 16px; }
.vazio { color: var(--texto-2); font-size: 16px; }

.aviso-arquivos {
  margin: 0;
  padding: 10px 32px;
  background: var(--superficie-2);
  border-bottom: 1px solid var(--alerta);
  color: var(--alerta);
}
.erro {
  background: var(--superficie);
  border: 1px solid var(--alerta);
  border-radius: 8px;
  padding: 16px 20px;
}
.erro h2 { color: var(--alerta); }

table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--borda); vertical-align: top; }
thead th { color: var(--texto-2); font-weight: 600; font-size: 13px; background: var(--superficie-2); }
tbody th { font-weight: 600; }
td.valor, th.valor { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
tr.geral th, tr.geral td { border-top: 2px solid var(--destaque-escuro); font-weight: 700; }
tr.origem-especial td { background: var(--superficie-2); }

code, .chave { font-family: var(--mono); font-size: 12px; color: var(--texto-2); }
.marca-origem { color: var(--alerta); font-size: 12px; }
.nao-identificado { color: var(--texto-3); }

form.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: end;
  margin: 0 0 16px;
}
form.filtros label { display: flex; flex-direction: column; font-size: 12px; color: var(--texto-2); gap: 4px; }
input, select, button {
  background: var(--fundo);
  color: var(--texto);
  border: 1px solid var(--borda);
  border-radius: 6px;
  padding: 6px 10px;
  font: inherit;
}
button { background: var(--destaque-escuro); border-color: var(--destaque); cursor: pointer; }
button:hover { background: var(--destaque); color: var(--fundo); }

.paginacao { display: flex; gap: 16px; align-items: center; margin: 12px 0; color: var(--texto-2); }

dl.campos { display: grid; grid-template-columns: 280px 1fr; gap: 6px 16px; margin: 0; }
dl.campos dt { color: var(--texto-2); }
dl.campos dd { margin: 0; }
.ausente { color: var(--texto-3); font-style: italic; }
`;
