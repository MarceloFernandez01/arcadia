"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "@/lib/data";
import { useAvUser } from "@/lib/useAvUser";
import { useTouchDevice } from "@/lib/useTouchDevice";
import { GAME_REGISTRY } from "@/lib/games/registry";
import type { ArcadeGameEngine, EngineState } from "@/lib/games/types";
import { saveScore as saveScoreRemote } from "@/lib/scores";
import TouchControls from "@/components/TouchControls";

function getSavedPlayerName(): string | null {
  try {
    return localStorage.getItem("av_player_name");
  } catch {
    return null;
  }
}

function getStoredColorScheme(gameId: string): string | null {
  try {
    return localStorage.getItem(`av_color_scheme_${gameId}`);
  } catch {
    return null;
  }
}

export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const user = useAvUser();
  const isTouch = useTouchDevice();
  const displayName = user ? user.name : "INVITADO";
  const [paused, setPaused] = useState(false);
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(displayName);
  const [saved, setSaved] = useState(false);

  const registryEntry = GAME_REGISTRY[game.id];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArcadeGameEngine | null>(null);
  const [engineState, setEngineState] = useState<EngineState>(registryEntry.initialState);
  const [finalScore, setFinalScore] = useState(0);
  const [colorScheme, setColorScheme] = useState(registryEntry.colorSchemes?.[0]?.id);

  useEffect(() => {
    const stored = getStoredColorScheme(game.id);
    if (stored) setColorScheme(stored);
  }, [game.id]);

  useEffect(() => {
    if (isTouch) window.scrollTo(0, 0);
  }, [isTouch]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = registryEntry.create(
      canvasRef.current,
      {
        onStateChange: setEngineState,
        onGameOver: (score) => {
          engine.pause();
          setFinalScore(score);
          setName(getSavedPlayerName() || displayName);
          setOver(true);
        },
        initialColorScheme: getStoredColorScheme(game.id) ?? undefined,
      },
      secondaryCanvasRef.current ?? undefined,
    );
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const changeColorScheme = (id: string) => {
    setColorScheme(id);
    engineRef.current?.setColorScheme?.(id);
    try {
      localStorage.setItem(`av_color_scheme_${game.id}`, id);
    } catch {
      // localStorage no disponible
    }
  };

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

  const openPauseMenu = () => {
    engineRef.current?.pause();
    setPaused(true);
    setPauseMenuOpen(true);
  };

  const resumeFromPauseMenu = () => {
    engineRef.current?.resume();
    setPaused(false);
    setPauseMenuOpen(false);
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
    setPauseMenuOpen(false);
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
    <div className={`av-player fade-in${isTouch ? " touch-mode" : ""}`}>
      <div className="player-hud">
        <div
          className="hud-stats-row"
          style={isTouch ? undefined : { display: "flex", gap: 24, flexWrap: "wrap" }}
        >
          {!isTouch && (
            <div className="hud-stat">
              <div className="l">Jugador</div>
              <div className="v" style={{ color: "var(--ink)" }}>
                {name}
              </div>
            </div>
          )}
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
        {registryEntry.colorSchemes && !isTouch && (
          <div className="hud-stat">
            <div className="l">Esquema</div>
            <select
              className="scheme-select"
              value={colorScheme}
              onChange={(e) => changeColorScheme(e.target.value)}
            >
              {registryEntry.colorSchemes.map((scheme) => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {isTouch ? (
          <div className="hud-actions">
            <button className="btn yellow" onClick={openPauseMenu}>
              PAUSA
            </button>
          </div>
        ) : (
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
        )}
      </div>

      <div className="crt">
        <div className="crt-screen">
          <canvas
            ref={canvasRef}
            width={registryEntry.width}
            height={registryEntry.height}
            className={`${registryEntry.secondaryCanvas ? "game-canvas-fixed" : "game-canvas"}${isTouch ? " touch-scaled-canvas" : ""}${isTouch && registryEntry.width === registryEntry.height ? " touch-square-canvas" : ""}${
              isTouch &&
              !registryEntry.secondaryCanvas &&
              registryEntry.height > registryEntry.width
                ? " touch-portrait-canvas"
                : ""
            }`}
            style={
              isTouch
                ? {
                    aspectRatio: `${registryEntry.width} / ${registryEntry.height}`,
                    // Tetris (1:2) es el único juego con canvas secundario; al ser el más alto,
                    // necesita un tope menor para dejar espacio al preview y al D-pad debajo.
                    maxHeight: registryEntry.secondaryCanvas ? "30vh" : undefined,
                  }
                : undefined
            }
          />
          {registryEntry.secondaryCanvas && (
            <canvas
              ref={secondaryCanvasRef}
              width={registryEntry.secondaryCanvas.width}
              height={registryEntry.secondaryCanvas.height}
              className="next-piece-canvas"
              aria-label={registryEntry.secondaryCanvas.label}
            />
          )}
          {paused && !isTouch && (
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

      {isTouch && registryEntry.touchControls && (
        <TouchControls config={registryEntry.touchControls} />
      )}

      {paused && isTouch && pauseMenuOpen && (
        <div className="pause-overlay-mobile">
          <div className="pause-menu-mobile">
            <div className="pixel neon-yellow" style={{ fontSize: 18 }}>
              EN PAUSA
            </div>
            {registryEntry.colorSchemes && (
              <div className="hud-stat" style={{ marginTop: 16 }}>
                <div className="l">Esquema</div>
                <select
                  className="scheme-select"
                  value={colorScheme}
                  onChange={(e) => changeColorScheme(e.target.value)}
                >
                  {registryEntry.colorSchemes.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginTop: 16,
              }}
            >
              <button className="btn yellow" onClick={resumeFromPauseMenu}>
                REANUDAR
              </button>
              <button className="btn magenta" onClick={endGame}>
                FIN
              </button>
              <button className="btn ghost" onClick={() => router.push(`/juego/${game.id}`)}>
                SALIR
              </button>
            </div>
          </div>
        </div>
      )}

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
