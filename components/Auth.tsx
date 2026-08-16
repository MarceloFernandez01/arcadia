"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TerminalMessage from "@/components/TerminalMessage";

export default function Auth() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"in" | "up">("in");
  const [recovery, setRecovery] = useState(false);
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const switchTab = (next: "in" | "up") => {
    setTab(next);
    resetMessages();
  };

  const openRecovery = () => {
    setRecovery(true);
    resetMessages();
  };

  const closeRecovery = () => {
    setRecovery(false);
    resetMessages();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    if (tab === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: user.trim(),
        password: pass,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/biblioteca");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: { name: (user || "PLAYER1").toUpperCase().slice(0, 10) },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Revisa tu correo para confirmar la cuenta.");
  };

  const guest = () => {
    router.push("/biblioteca");
  };

  const oauth = async (provider: "google" | "github") => {
    resetMessages();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
  };

  const submitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/actualizar-contrasena`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Revisa tu correo para restablecer tu contraseña.");
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
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {recovery ? (
          <>
            {info ? (
              <>
                <TerminalMessage
                  command="./reset_password --email"
                  tone="success"
                  lines={["[OK] Solicitud enviada…", `> ${info.toUpperCase()}`]}
                />
                <button
                  className="btn ghost"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={closeRecovery}
                >
                  ← VOLVER A INICIAR SESIÓN
                </button>
              </>
            ) : (
              <>
                <form onSubmit={submitRecovery}>
                  <div className="field">
                    <label>Correo electrónico</label>
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="jugador@vault.gg"
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
                        <span className="spinner"></span> ENVIANDO...
                      </>
                    ) : (
                      "ENVIAR ENLACE"
                    )}
                  </button>
                </form>
                {error && (
                  <TerminalMessage
                    command="./reset_password --email"
                    tone="error"
                    lines={["[OK] Conectando con servidor…", `[FAIL] ${error}`]}
                  />
                )}
                <button
                  className="btn ghost"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={closeRecovery}
                >
                  ← VOLVER A INICIAR SESIÓN
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <div className="auth-tabs">
              <button className={tab === "in" ? "on" : ""} onClick={() => switchTab("in")}>
                INICIAR SESIÓN
              </button>
              <button className={tab === "up" ? "on" : ""} onClick={() => switchTab("up")}>
                CREAR CUENTA
              </button>
            </div>

            {tab === "up" && info ? (
              <>
                <TerminalMessage
                  command="./create_account --confirm-email"
                  tone="success"
                  lines={["[OK] Cuenta creada…", `> ${info.toUpperCase()}`]}
                />
                <button
                  className="btn ghost"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={() => switchTab("in")}
                >
                  ← VOLVER A INICIAR SESIÓN
                </button>
              </>
            ) : (
              <>
                <form onSubmit={submit}>
                  <div className="field">
                    <label>{tab === "in" ? "Usuario o correo" : "Usuario"}</label>
                    <input
                      type={tab === "in" ? "email" : "text"}
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      placeholder={tab === "in" ? "jugador@vault.gg" : "px_kai"}
                    />
                  </div>
                  {tab === "up" && (
                    <div className="field slide-in">
                      <label>Correo electrónico</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jugador@vault.gg"
                      />
                    </div>
                  )}
                  <div className="field">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
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
                        <span className="spinner"></span>{" "}
                        {tab === "in" ? "ENTRANDO..." : "CREANDO..."}
                      </>
                    ) : tab === "in" ? (
                      "ENTRAR AL VAULT"
                    ) : (
                      "CREAR Y JUGAR"
                    )}
                  </button>
                </form>

                {tab === "in" && (
                  <button
                    className="btn ghost"
                    type="button"
                    style={{ width: "100%", marginTop: 10, textDecoration: "underline" }}
                    onClick={openRecovery}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                {error && (
                  <TerminalMessage
                    command={tab === "in" ? "./sign_in --email" : "./create_account --email"}
                    tone="error"
                    lines={["[OK] Conectando con servidor…", `[FAIL] ${error}`]}
                  />
                )}

                <button
                  className="btn ghost"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={guest}
                >
                  JUGAR COMO INVITADO
                </button>

                <div className="auth-divider">O CONTINÚA CON</div>
                <div className="social">
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => oauth("google")}
                    disabled={loading}
                  >
                    ◆ GOOGLE
                  </button>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => oauth("github")}
                    disabled={loading}
                  >
                    ▣ GITHUB
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 11,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
