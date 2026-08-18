"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { homePath } from "@/lib/auth";
import { useAuth } from "@/components/providers/AuthProvider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, loginAsGuest, user, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const busy = loading || guestLoading;

  useEffect(() => {
    if (ready && user) {
      router.replace(homePath(user.role));
    }
  }, [ready, user, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError("");
    setGuestLoading(true);

    try {
      await loginAsGuest();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível abrir a consulta"
      );
    } finally {
      setGuestLoading(false);
    }
  }

  if (!ready || user) {
    return <div className="loading-screen">Carregando...</div>;
  }

  return (
    <div className="login-page">
      <div className="login-stage">
        <aside className="login-hero">
          <div className="login-pitch" aria-hidden />
          <div>
            <span className="login-badge">Painel do time</span>
            <h1 className="brand">FUTEBOL</h1>
            <p className="brand-sub">Gestão e consulta do time</p>
          </div>
          <ul className="login-highlights">
            <li>Jogadores e mensalidades</li>
            <li>Caixa, despesas e relatórios</li>
            <li>Consulta individual do jogador</li>
          </ul>
        </aside>

        <form className="login-card" onSubmit={handleSubmit}>
          <p className="login-kicker">Acesso</p>
          <h2 className="login-title">Entre na sua conta</h2>
          <p className="login-hint">
            Use o e-mail e a senha liberados pelo administrador.
          </p>

          {error ? (
            <div className="error-box" role="alert">
              {error}
            </div>
          ) : null}

          <div className="form-grid">
            <div className="field full">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                placeholder="admin@email.com"
              />
            </div>
            <div className="field full">
              <label htmlFor="password">Senha</label>
              <div className="login-password">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={busy}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          </div>

          <button className="btn login-submit" type="submit" disabled={busy}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <button
            className="btn-secondary login-guest"
            type="button"
            onClick={handleGuest}
            disabled={busy}
          >
            {guestLoading ? "Abrindo consulta..." : "Ver painel (somente consulta)"}
          </button>
          <p className="login-guest-hint">
            Recrutadores e visitantes veem jogadores, pagamentos, despesas e
            relatórios. Sem cadastro e sem alterar dados.
          </p>
        </form>
      </div>
    </div>
  );
}
