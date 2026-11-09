import { Cabecalho } from "./cabecalho";
import { Rodape } from "./rodape";

export function Pagina({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Cabecalho />
      <main className="flex-1">{children}</main>
      <Rodape />
    </div>
  );
}
