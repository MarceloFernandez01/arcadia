"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/lib/data";
import { useAvUser } from "@/lib/useAvUser";
import { GAME_REGISTRY } from "@/lib/games/registry";
import type { ArcadeGameEngine, EngineState } from "@/lib/games/types";
import { saveScore as saveScoreRemote } from "@/lib/scores";

function getSavedPlayerName(): string | null {
  try {
    return localStorage.getItem("av_player_name");
  } catch {
    return null;
  }
}

export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const user = useAvUser();
  const displayName = user ? user.name : "INVITADO";
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);

  const registryEntry = GAME_REGISTRY[game.id];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArcadeGameEngine | null>(null);
  const [engineState, setEngineState] = useState<EngineState>(registryEntry.initialState);
  const [finalScore, setFinalScore] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = registryEntry.create(canvasRef.current, {
      onStateChange: setEngineState,
      onGameOver: (score) => {
        engine.pause();
        setFinalScore(score);
        setName(getSavedPlayerName() || displayName);
        setOver(true);
      },
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

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
    setFinalScore(engineState.score);
    setName(getSavedPlayerName() || displayName);
    setOver(true);
  };

  const restart = () => {
    engineRef.current?.restart();
    engineRef.current?.start();
    setPaused(false);
    setOver(false);
    setSaved(false);
  };

  const saveScore = async () => {
    await saveScoreRemote(game.id, name, finalScore);
    try {
      localStorage.setItem("av_player_name", name);
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
            <div className="v">{engineState.score}</div>
          </div>
          {engineState.stats.map((stat) => (
            <div className={`hud-stat ${stat.key}`} key={stat.key}>
              <div className="l">{stat.label}</div>
              <div className="v">{stat.value}</div>
            </div>
          ))}
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
          <canvas
            ref={canvasRef}
            width={registryEntry.width}
            height={registryEntry.height}
            className="game-canvas"
          />
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
