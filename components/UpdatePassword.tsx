"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TerminalMessage from "@/components/TerminalMessage";

export default function UpdatePassword() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/biblioteca");
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            NUEVA CONTRASEÑA
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Contraseña nueva</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="field">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            className="btn lg"
            type="submit"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span> ACTUALIZANDO...
              </>
            ) : (
              "ACTUALIZAR CONTRASEÑA"
            )}
          </button>
        </form>

        {error && (
          <TerminalMessage
            command="./update_password"
            tone="error"
            lines={["[OK] Conectando con servidor…", `[FAIL] ${error}`]}
          />
        )}
      </div>
    </div>
  );
}
