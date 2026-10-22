"use client";

import { FirebaseError } from "firebase/app";
import {
  average,
  collection,
  count,
  doc,
  getAggregateFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/componentes/autenticacao/ProvedorAuth";
import { fotoConfiavel } from "@/lib/avatar";
import { firebaseConfigurado } from "@/lib/env";
import { db } from "@/lib/firebase";
import { paraAvaliacao, type Avaliacao } from "@/tipos/avaliacao";

const POR_PAGINA = 6;
const A_MAIS = 12; // cada "Mostrar mais" traz mais estas, até acabar
const MAX_COMENTARIO = 2000; // o mesmo limite das Firestore Rules
const MAX_NOME = 200;

function Estrelas({ valor, aoMudar, tamanho = 16 }: { valor: number; aoMudar?: (n: number) => void; tamanho?: number }) {
  const [sobre, setSobre] = useState(0);
  const editavel = Boolean(aoMudar);
  return (
    <div style={{ display: "flex", gap: 4 }} role={editavel ? "radiogroup" : "img"} aria-label={editavel ? "Sua nota" : `${valor} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const estilo = {
          fontSize: tamanho,
          cursor: editavel ? "pointer" : "default",
          color: n <= (sobre || valor) ? "var(--ocre)" : "var(--linha)",
          transition: "color 0.15s",
          userSelect: "none" as const,
          background: "none",
          border: "none",
          padding: 0,
          lineHeight: 1,
        };
        return editavel ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            onClick={() => aoMudar?.(n)}
            onMouseEnter={() => setSobre(n)}
            onMouseLeave={() => setSobre(0)}
            style={estilo}
          >
            ★
          </button>
        ) : (
          <span key={n} aria-hidden="true" style={estilo}>
            ★
          </span>
        );
      })}
    </div>
  );
}

function tempoRelativo(data: Date): string {
  const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
  if (segundos < 60) return "agora mesmo";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `há ${dias} dia${dias > 1 ? "s" : ""}`;
  const semanas = Math.floor(dias / 7);
  // Entre 28 e 29 dias o cálculo por mês dava "há 0 mês" (no React e no Flutter).
  if (semanas < 4 || dias < 30) return `há ${semanas} semana${semanas > 1 ? "s" : ""}`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} ${meses > 1 ? "meses" : "mês"}`;
  const anos = Math.floor(meses / 12);
  return `há ${anos} ano${anos > 1 ? "s" : ""}`;
}

type Resumo = { total: number; media: number | null };

export function Avaliacoes() {
  const { usuario, abrirLogin } = useAuth();
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [resumo, setResumo] = useState<Resumo>({ total: 0, media: null });
  const [limite, setLimite] = useState(POR_PAGINA);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(() => !firebaseConfigurado());
  // Sem rede, o Firestore não dá erro: entrega o cache (vazio) e segue tentando.
  const [doServidor, setDoServidor] = useState(false);

  // Média e total vêm de uma agregação no servidor, e não de somar a lista. Só a
  // resposta do pedido mais recente vale: uma lenta que chegue depois não
  // sobrescreve a nova.
  const pedidoResumo = useRef(0);
  const atualizarResumo = useCallback(() => {
    const pedido = ++pedidoResumo.current;
    getAggregateFromServer(collection(db(), "avaliacoes"), { total: count(), media: average("nota") })
      .then((r) => {
        if (pedido === pedidoResumo.current) setResumo({ total: r.data().total, media: r.data().media });
      })
      .catch((e) => console.error("Resumo das avaliações:", e));
  }, []);

  // Agregação não é tempo real: uma edição fora da página visível não dispara a
  // lista. O resumo é refeito também de tempos em tempos.
  useEffect(() => {
    if (!firebaseConfigurado()) return;
    const relogio = setInterval(atualizarResumo, 60_000);
    return () => clearInterval(relogio);
  }, [atualizarResumo]);

  // Lista em tempo real, só do que aparece na tela.
  useEffect(() => {
    if (!firebaseConfigurado()) return;
    const q = query(collection(db(), "avaliacoes"), orderBy("criadoEm", "desc"), limit(limite));
    return onSnapshot(
      q,
      (snap) => {
        setFalhaAoCarregar(false);
        if (!snap.metadata.fromCache) setDoServidor(true);
        setAvaliacoes(
          snap.docs
            .map((d) => paraAvaliacao(d.id, d.data({ serverTimestamps: "estimate" })))
            .filter((a): a is Avaliacao => a !== null),
        );
        atualizarResumo();
      },
      (e) => {
        console.error("Avaliações:", e);
        setFalhaAoCarregar(true);
      },
    );
  }, [limite, atualizarResumo]);

  async function enviar() {
    setErro("");
    if (!usuario) {
      abrirLogin();
      return;
    }
    if (nota === 0) {
      setErro("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }
    if (!comentario.trim()) {
      setErro("Escreva um comentário.");
      return;
    }
    setEnviando(true);
    try {
      const dados = {
        nome: (usuario.displayName?.trim() || "Usuário").slice(0, MAX_NOME),
        photoURL: fotoConfiavel(usuario.photoURL),
        nota,
        comentario: comentario.trim(),
      };
      // Uma avaliação por pessoa (as rules exigem que o id seja o uid). Se a pessoa
      // já avaliou — inclusive numa avaliação antiga, de antes dessa regra —, a
      // existente é atualizada em vez de criar outra.
      const existente = await getDocs(query(collection(db(), "avaliacoes"), where("uid", "==", usuario.uid), limit(1)));
      const anterior = existente.docs[0];
      if (anterior) {
        await updateDoc(anterior.ref, { ...dados, atualizadoEm: serverTimestamp() });
      } else {
        // Hora do servidor, não do relógio de quem avalia.
        await setDoc(doc(db(), "avaliacoes", usuario.uid), { ...dados, uid: usuario.uid, criadoEm: serverTimestamp() });
      }
      atualizarResumo();
      setNota(0);
      setComentario("");
      setSucesso(anterior ? "Sua avaliação foi atualizada." : "Obrigado! Sua avaliação foi publicada.");
      setTimeout(() => setSucesso(""), 3000);
    } catch (e) {
      // No React, uma falha aqui deixava o botão em "Enviando..." para sempre.
      console.error(e);
      setErro(
        e instanceof FirebaseError && e.code === "permission-denied"
          ? `O servidor recusou a avaliação. Confira se o comentário tem até ${MAX_COMENTARIO} caracteres e tente de novo.`
          : "Não foi possível enviar sua avaliação. Verifique sua conexão e tente de novo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  const restantes = resumo.total - avaliacoes.length;

  return (
    <section className="section-pad" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 12, letterSpacing: "-0.02em", lineHeight: 1.05 }}>O que dizem do site</h2>
            <p style={{ fontSize: 18, color: "var(--tinta-2)" }}>Opiniões de quem passou por aqui.</p>
          </div>
          {resumo.media !== null && resumo.total > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "var(--fonte-titulo)", fontSize: 40, color: "var(--tinta)", lineHeight: 1 }}>{resumo.media.toFixed(1).replace(".", ",")}</span>
              <div>
                <Estrelas valor={Math.round(resumo.media)} />
                <p style={{ fontSize: 14, color: "var(--tinta-3)", marginTop: 2 }}>
                  {resumo.total} {resumo.total === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
            </div>
          )}
        </div>

        {falhaAoCarregar ? (
          <p style={{ color: "var(--tinta-3)", marginBottom: 24 }}>Não foi possível carregar as avaliações agora.</p>
        ) : (
          !doServidor &&
          avaliacoes.length === 0 && (
            <p role="status" style={{ color: "var(--tinta-3)", marginBottom: 24 }}>
              Carregando avaliações...
            </p>
          )
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "32px 40px", marginBottom: 32 }}>
          {avaliacoes.map((av) => (
            <figure key={av.id} style={{ borderTop: "1px solid var(--linha)", paddingTop: 20 }}>
              <Estrelas valor={av.nota} tamanho={14} />
              <blockquote style={{ fontSize: 17, color: "var(--tinta)", lineHeight: 1.55, overflowWrap: "anywhere", margin: "10px 0 16px" }}>{av.comentario}</blockquote>
              <figcaption style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", background: "var(--mata-clara)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {av.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={av.photoURL} alt="" referrerPolicy="no-referrer" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mata)" }}>{av.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span style={{ fontSize: 15, color: "var(--tinta-2)" }}>
                  {av.nome} <span style={{ color: "var(--tinta-3)" }}>· {tempoRelativo(av.criadoEm)}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {(restantes > 0 || limite > POR_PAGINA) && resumo.total > POR_PAGINA && (
          <div style={{ marginBottom: 56, textAlign: "center" }}>
            <button
              type="button"
              // De 12 em 12, até acabar. Antes "Mostrar mais" trazia no máximo 100 e
              // anunciava as que passassem disso como restantes, sem chegar nelas.
              onClick={() => setLimite((l) => (restantes > 0 ? l + A_MAIS : POR_PAGINA))}
              className="link"
              style={{ padding: 0 }}
            >
              {restantes > 0 ? `Mostrar mais (${restantes} restantes)` : "Mostrar menos"}
            </button>
          </div>
        )}

        <div style={{ background: "var(--branco)", border: "1px solid var(--linha)", borderRadius: "var(--raio)", padding: "28px", maxWidth: 560, margin: "0 auto" }}>
          <h3 style={{ fontSize: 22, marginBottom: 20 }}>{usuario ? "Deixe sua avaliação" : "Faça login para avaliar"}</h3>

          {sucesso && (
            <div role="status" style={{ background: "var(--mata-clara)", borderRadius: "var(--raio)", padding: "10px 14px", marginBottom: 16, fontSize: 15, color: "var(--mata-escura)" }}>
              {sucesso}
            </div>
          )}
          {erro && (
            <div role="alert" style={{ background: "var(--terra-clara)", borderRadius: "var(--raio)", padding: "10px 14px", marginBottom: 16, fontSize: 15, color: "var(--terra)" }}>
              {erro}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 15, color: "var(--tinta-2)", marginBottom: 6 }}>Sua nota</p>
            <Estrelas valor={nota} aoMudar={setNota} tamanho={28} />
          </div>

          <textarea
            aria-label="Comentário"
            placeholder={usuario ? "Escreva seu comentário sobre o site..." : "Faça login para deixar um comentário..."}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            disabled={!usuario}
            maxLength={MAX_COMENTARIO}
            rows={4}
            style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--linha)", borderRadius: "var(--raio)", fontSize: 16, resize: "vertical", boxSizing: "border-box", background: usuario ? "var(--branco)" : "var(--papel-2)", color: "var(--tinta)", marginBottom: 14, fontFamily: "inherit" }}
          />

          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="botao botao-cheio"
            style={{ width: "100%" }}
          >
            {!usuario ? "Entrar para avaliar" : enviando ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </section>
  );
}
