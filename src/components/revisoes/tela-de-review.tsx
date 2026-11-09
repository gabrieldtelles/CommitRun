"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { podeRevisar, type ComentarioDeReview, type PullRequest, type Veredito } from "@/lib/pull-request";
import { useProgresso } from "@/store/progresso";
import { FormularioDeReview } from "./formulario-de-review";
import { ListaDeReviews } from "./lista-de-reviews";
import { VisorDeDiff } from "./visor-de-diff";

export function TelaDeReview({ id }: { id: string }) {
  const router = useRouter();
  const recarregarProgresso = useProgresso((estado) => estado.recarregar);
  const [pr, setPr] = useState<PullRequest | null>(null);
  const [contaId, setContaId] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<ComentarioDeReview[]>([]);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    const buscar = async () => {
      try {
        const resposta = await fetch(`/api/prs/${id}`, { cache: "no-store" });
        if (!resposta.ok) throw new Error("não encontrado");
        const dados = (await resposta.json()) as { pr: PullRequest; contaId: string };
        if (!ativo) return;
        setPr(dados.pr);
        setContaId(dados.contaId);
        setEstado("pronto");
      } catch {
        if (ativo) setEstado("erro");
      }
    };

    void buscar();
    return () => {
      ativo = false;
    };
  }, [id]);

  const comentar = (comentario: ComentarioDeReview) =>
    setComentarios((atuais) => [...atuais, comentario]);

  const enviar = async (veredito: Veredito, resumo: string) => {
    setErro(null);
    setEnviando(true);

    try {
      const resposta = await fetch(`/api/prs/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ veredito, resumo, comentarios }),
      });

      const dados = (await resposta.json()) as { erro?: string };
      if (!resposta.ok) {
        setErro(dados.erro ?? "não foi possível enviar");
        setEnviando(false);
        return;
      }

      await recarregarProgresso();
      router.push("/revisoes");
      router.refresh();
    } catch {
      setErro("não foi possível falar com o servidor");
      setEnviando(false);
    }
  };

  if (estado === "carregando") {
    return <p className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">Carregando...</p>;
  }

  if (estado === "erro" || !pr) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-muted">Este pull request não está disponível.</p>
        <Link href="/revisoes" className="mt-4 inline-block text-sm text-lime hover:underline">
          Voltar para as revisões
        </Link>
      </div>
    );
  }

  const posso = contaId ? podeRevisar(pr, contaId) : false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/revisoes" className="font-mono text-xs text-muted hover:text-lime">
        ← revisões
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{pr.titulo}</h1>
      <p className="mt-1 text-sm text-muted">
        {pr.autorApelido} · missão {pr.missaoTitulo} · {pr.arquivos.length} arquivo(s)
      </p>

      {pr.descricao && (
        <p className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">{pr.descricao}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <VisorDeDiff
          arquivos={pr.arquivos}
          comentarios={comentarios}
          onComentar={posso ? comentar : undefined}
        />

        <div className="space-y-6">
          {posso ? (
            <FormularioDeReview
              comentarios={comentarios}
              enviando={enviando}
              erro={erro}
              onRemoverComentario={(posicao) =>
                setComentarios((atuais) => atuais.filter((_, indice) => indice !== posicao))
              }
              onEnviar={enviar}
            />
          ) : (
            <p className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">
              {pr.autorId === contaId
                ? "Este pull request é seu — acompanhe os reviews recebidos abaixo."
                : "Você já revisou este pull request ou ele já recebeu os reviews necessários."}
            </p>
          )}

          <ListaDeReviews pr={pr} contaId={contaId} aoAvaliar={setPr} />
        </div>
      </div>
    </div>
  );
}
