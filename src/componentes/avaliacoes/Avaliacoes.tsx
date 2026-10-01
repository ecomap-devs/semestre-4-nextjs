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
          color: n <= (sobre || valor) ? "#f59e0b" : "#d1d5db",
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
      setSucesso(anterior ? "Sua avaliação foi atualizada." : "Avaliação enviada com sucesso!");
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
    <section style={{ background: "#f8fafc", padding: "72px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#16a34a", textTransform: "uppercase", marginBottom: 12 }}>Comunidade</p>
        <h2 style={{ textAlign: "center", fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, color: "#111", marginBottom: 8 }}>Avaliações do Site</h2>

        {resumo.media !== null && resumo.total > 0 ? (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "12px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: "#111" }}>{resumo.media.toFixed(1).replace(".", ",")}</span>
              <div>
                <Estrelas valor={Math.round(resumo.media)} />
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                  Classificação do site • {resumo.total} {resumo.total === 1 ? "avaliação" : "avaliações"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 48 }} />
        )}

        {falhaAoCarregar ? (
          <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 24 }}>Não foi possível carregar as avaliações agora.</p>
        ) : (
          !doServidor &&
          avaliacoes.length === 0 && (
            <p role="status" style={{ textAlign: "center", color: "#6b7280", marginBottom: 24 }}>
              Carregando avaliações...
            </p>
          )
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 20, marginBottom: 24 }}>
          {avaliacoes.map((av) => (
            <div key={av.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", background: "linear-gradient(135deg,#d1fae5,#a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {av.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={av.photoURL} alt="" referrerPolicy="no-referrer" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>{av.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{av.nome}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Estrelas valor={av.nota} />
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{tempoRelativo(av.criadoEm)}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, overflowWrap: "anywhere" }}>{av.comentario}</p>
            </div>
          ))}
        </div>

        {(restantes > 0 || limite > POR_PAGINA) && resumo.total > POR_PAGINA && (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <button
              type="button"
              // De 12 em 12, até acabar. Antes "Mostrar mais" trazia no máximo 100 e
              // anunciava as que passassem disso como restantes, sem chegar nelas.
              onClick={() => setLimite((l) => (restantes > 0 ? l + A_MAIS : POR_PAGINA))}
              style={{ background: "none", border: "1px solid #16a34a", color: "#16a34a", borderRadius: 10, padding: "10px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {restantes > 0 ? `Mostrar mais (${restantes} restantes)` : "Mostrar menos"}
            </button>
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "32px", maxWidth: 600, margin: "0 auto", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 20 }}>{usuario ? "Deixe sua avaliação" : "Faça login para avaliar"}</h3>

          {sucesso && (
            <div role="status" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
              ✓ {sucesso}
            </div>
          )}
          {erro && (
            <div role="alert" style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
              {erro}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Sua nota:</p>
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
            style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", background: usuario ? "#fff" : "#f9fafb", color: "#374151", marginBottom: 14, fontFamily: "inherit" }}
          />

          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            style={{ width: "100%", padding: "12px", background: enviando ? "#86efac" : "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: enviando ? "not-allowed" : "pointer", transition: "background 0.2s" }}
          >
            {!usuario ? "Entrar para avaliar" : enviando ? "Enviando..." : "Enviar avaliação"}
          </button>
        </div>
      </div>
    </section>
  );
}
