"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Loader2, Trophy, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorObj, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Register state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Funciona para ambos Formularios
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isLoginTab) {
      // INICIO DE SESIÓN
      try {
        const checkBlocked = await fetch(`/api/auth/check-blocked?email=${encodeURIComponent(form.email)}`);
        if (checkBlocked.ok) {
          const checkData = await checkBlocked.json();
          if (checkData.isBlocked) {
            setError("Tu cuenta ha sido bloqueada por el administrador.");
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // Continuar si falla la comprobación
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });
      if (res?.error) {
        setError("Correo o contraseña incorrectos.");
        setLoading(false);
      } else {
        router.push("/"); // Redirigir al panel principal
        router.refresh();
      }
    } else {
      // REGISTRO Y CREACION DE CUENTA
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-\[\]\{\}\(\)\|\+\=\*\/\^\#])[A-Za-z\d@$!%*?&._\-\[\]\{\}\(\)\|\+\=\*\/\^\#]{8,}$/;
      if (!passwordRegex.test(form.password)) {
        setError("La contraseña debe tener al menos 8 caracteres, e incluir una mayúscula, una minúscula, un número y un carácter especial (ej. @, $, !, %, *, ?, &, ., _, -).");
        setLoading(false);
        return;
      }

      if (form.password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al registrarse.");
          setLoading(false);
          return;
        }

        // Si se registró exitosamente, loguearse automáticamente
        await signIn("credentials", {
          redirect: false,
          email: form.email,
          password: form.password,
        });

        router.push("/");
        router.refresh();
      } catch (err) {
        setError("Ocurrió un problema de conectividad.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-6 sm:py-12 transition-colors duration-300">
      {/* Botón de Cambio de Tema */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <Sun className="h-5 w-5 dark:hidden" />
        <Moon className="hidden h-5 w-5 dark:block" />
      </button>

      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-primary mb-2 sm:mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Quiniela Mundial
          </h2>
          <p className="mt-1 sm:mt-2 text-sm text-muted-foreground">
            {isLoginTab
              ? "Inicia sesión y compite con tus grupos"
              : "Crea tu cuenta segura"}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Tabs Reutilizables Raw CSS Tailwind */}
          <div className="flex w-full border-b border-border bg-secondary/50">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setError("");
                setConfirmPassword("");
              }}
              className={`flex-1 py-3 sm:py-4 text-sm font-semibold transition-colors ${
                isLoginTab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setError("");
                setConfirmPassword("");
              }}
              className={`flex-1 py-3 sm:py-4 text-sm font-semibold transition-colors ${
                !isLoginTab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-8">
            {errorObj && (
              <div className="flex items-center gap-2.5 rounded-lg border border-destructive/10 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="h-4.5 w-4.5 text-destructive shrink-0" />
                <span className="font-medium text-left">{errorObj}</span>
              </div>
            )}

            {!isLoginTab && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-medium leading-none text-foreground">
                    Nombre
                  </label>
                  <input
                    required
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Nombre"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-medium leading-none text-foreground">
                    Apellido
                  </label>
                  <input
                    required
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Apellido"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none text-foreground">
                Correo electronico
              </label>
              <input
                required
                type="text"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Ingresa tu correo o usuario"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!isLoginTab && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none text-foreground">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isLoginTab ? "Ingresar" : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
