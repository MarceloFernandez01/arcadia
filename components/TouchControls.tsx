"use client";

import { useCallback, useRef } from "react";
import type { TouchEvent } from "react";
import type { TouchControlsConfig } from "@/lib/games/types";

const REPEAT_INTERVAL_MS = 120;

// key incluida junto a code porque Arkanoid filtra el evento sintético por e.key
// (lib/games/arkanoid/engine.ts:63); sin key, sus botones no moverían la paleta.
const DPAD_BUTTONS = {
  up: { code: "ArrowUp", key: "ArrowUp", label: "▲" },
  down: { code: "ArrowDown", key: "ArrowDown", label: "▼" },
  left: { code: "ArrowLeft", key: "ArrowLeft", label: "◀" },
  right: { code: "ArrowRight", key: "ArrowRight", label: "▶" },
} as const;

type DpadDirection = keyof typeof DPAD_BUTTONS;

function dispatchKeyEvent(type: "keydown" | "keyup", code: string, key: string) {
  window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }));
}

export default function TouchControls({ config }: { config: TouchControlsConfig }) {
  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const handlePress = useCallback((code: string, key: string, repeat: boolean) => {
    dispatchKeyEvent("keydown", code, key);
    if (repeat) {
      intervalRefs.current[code] = setInterval(() => {
        dispatchKeyEvent("keydown", code, key);
      }, REPEAT_INTERVAL_MS);
    }
  }, []);

  const handleRelease = useCallback((code: string, key: string) => {
    const interval = intervalRefs.current[code];
    if (interval) {
      clearInterval(interval);
      delete intervalRefs.current[code];
    }
    dispatchKeyEvent("keyup", code, key);
  }, []);

  const buttonHandlers = (code: string, key: string, repeat = false) => ({
    onTouchStart: (e: TouchEvent) => {
      e.preventDefault();
      handlePress(code, key, repeat);
    },
    onTouchEnd: (e: TouchEvent) => {
      e.preventDefault();
      handleRelease(code, key);
    },
    onTouchCancel: (e: TouchEvent) => {
      e.preventDefault();
      handleRelease(code, key);
    },
  });

  const hasActions = config.actions.length > 0;

  return (
    <div className={`touch-controls${hasActions ? " touch-controls-joystick" : ""}`}>
      <div className="touch-dpad">
        {(Object.keys(DPAD_BUTTONS) as DpadDirection[]).map((direction) => {
          const button = DPAD_BUTTONS[direction];
          const enabled = config.dpadEnabled.includes(direction);
          return (
            <button
              key={direction}
              type="button"
              className={`touch-action touch-dpad-${direction}`}
              disabled={!enabled}
              aria-label={button.label}
              {...(enabled ? buttonHandlers(button.code, button.key, config.dpadRepeat) : {})}
            >
              {button.label}
            </button>
          );
        })}
      </div>
      {config.actions.length > 0 && (
        <div className="touch-actions">
          {config.actions.map((action) => (
            <button
              key={action.code}
              type="button"
              className="touch-action touch-action-btn"
              aria-label={action.label}
              {...buttonHandlers(action.code, action.key, action.repeat)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
