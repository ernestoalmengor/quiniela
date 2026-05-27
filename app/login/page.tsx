"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Sun, Loader2, Trophy } from "lucide-react"

export default function LoginPage() {
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorObj, setError] = useState("")

  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // Register state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  })

  // Funciona para ambos Formularios
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (isLoginTab) {
      // INICIO DE SESIÓN
      const res = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      })
      if (res?.error) {
        setError("Correo o contraseña incorrectos.")
        setLoading(false)
      } else {
        router.push("/") // Redirigir al panel principal
        router.refresh()
      }
    } else {
      // REGISTRO Y CREACION DE CUENTA
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.message || "Error al registrarse.")
          setLoading(false)
          return
        }

        // Si se registró exitosamente, loguearse automáticamente
        await signIn("credentials", {
          redirect: false,
          email: form.email,
          password: form.password,
        })
        
        router.push("/")
        router.refresh()
      } catch (err) {
        setError("Ocurrió un problema de conectividad.")
        setLoading(false)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 transition-colors duration-300">
      
      {/* Botón de Cambio de Tema */}
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <Sun className="h-5 w-5 dark:hidden" />
        <Moon className="hidden h-5 w-5 dark:block" />
      </button>

      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Trophy className="h-16 w-16 text-primary mb-4" />
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Quiniela Mundial
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoginTab ? "Inicia sesión y compite con tus grupos" : "Crea tu cuenta segura"}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* Tabs Reutilizables Raw CSS Tailwind */}
          <div className="flex w-full border-b border-border bg-secondary/50">
            <button
              onClick={() => { setIsLoginTab(true); setError(""); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                isLoginTab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setIsLoginTab(false); setError(""); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                !isLoginTab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
            {errorObj && (
              <div className="rounded-lg bg-destructive/15 p-3 text-center text-sm font-medium text-destructive">
                {errorObj}
              </div>
            )}

            {!isLoginTab && (
              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-medium leading-none text-foreground">Primer Nombre</label>
                  <input
                    required
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Eje: Kevin"
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-medium leading-none text-foreground">Apellido / Segundo Nombre</label>
                  <input
                    required
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Eje: Almengor"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none text-foreground">Correo o Nombre de Usuario</label>
              <input
                required
                type="text"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="mlopez o tu@correo.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none text-foreground">Contraseña</label>
              <input
                required
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoginTab ? "Entrar a la Quiniela" : "Crear mi cuenta gratis"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
