"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/lib/data";
import { useAvUser } from "@/lib/useAvUser";
import { AsteroidsEngine, type AsteroidsEngineState } from "@/lib/games/asteroids/engine";

const MOCK_FINAL_SCORE = 47280;

const REAL_ENGINE_GAME_IDS = ["asteroides"];

export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const user = useAvUser();
  const displayName = user ? user.name : "INVITADO";
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);

  const hasRealEngine = REAL_ENGINE_GAME_IDS.includes(game.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);
  const [engineState, setEngineState] = useState<AsteroidsEngineState>({
    score: 0,
    lives: 3,
    level: 1,
  });
  const [finalScore, setFinalScore] = useState(MOCK_FINAL_SCORE);

  useEffect(() => {
    if (!hasRealEngine || !canvasRef.current) return;

    const engine = new AsteroidsEngine(canvasRef.current, {
      onStateChange: setEngineState,
      onGameOver: (score) => {
        engine.pause();
        setFinalScore(score);
        setName(displayName);
        setOver(true);
      },
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [hasRealEngine]);

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      if (next) {
        engineRef.current?.pause();
      } else {
        engineRef.current?.resume();
      }
      return next;
    });
  };

  const endGame = () => {
    engineRef.current?.pause();
    setFinalScore(hasRealEngine ? engineState.score : MOCK_FINAL_SCORE);
    setName(displayName);
    setOver(true);
  };

  const restart = () => {
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const saveScore = () => {
    try {
      const all = JSON.parse(localStorage.getItem("av_scores") || "[]");
      all.push({ game: game.id, score: MOCK_FINAL_SCORE, name, at: Date.now() });
      localStorage.setItem("av_scores", JSON.stringify(all));
    } catch {
      // localStorage no disponible
    }
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{hasRealEngine ? engineState.score : 0}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">
              {hasRealEngine ? Array(engineState.lives).fill("♥").join(" ") : "♥ ♥ ♥"}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">
              {(hasRealEngine ? engineState.level : 1).toString().padStart(2, "0")}
            </div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={togglePause}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <button className="btn ghost" onClick={() => router.push(`/juego/${game.id}`)}>
            SALIR
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {hasRealEngine ? (
            <canvas ref={canvasRef} width={800} height={600} className="asteroids-canvas" />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{finalScore.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={saveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/biblioteca")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
