import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

// Os links de convite e de recuperação trazem o token no fragmento (#...), que
// o navegador não manda ao servidor. Lê o fragmento sem alterar o endereço;
// a página apaga com useApagarFragmento() ao montar.
export function lerFragmento(): URLSearchParams {
  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

// Apaga o fragmento pelo roteador (navigate com replace). replaceState(null, ...)
// jogaria fora o estado do histórico que o roteador guarda (chave e posição).
export function useApagarFragmento(): void {
  const navegar = useNavigate();
  const { pathname, search } = useLocation();
  useEffect(() => {
    navegar(pathname + search, { replace: true });
    // só ao montar: o token já foi lido no estado inicial da página
  }, []);
}
