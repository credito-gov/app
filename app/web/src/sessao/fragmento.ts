// Os links de convite e de recuperação trazem o token no fragmento (#...), que
// o navegador não manda ao servidor. Lê o fragmento sem alterar o endereço;
// quem chama apaga com apagarFragmento() num efeito.
export function lerFragmento(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export function apagarFragmento(): void {
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
