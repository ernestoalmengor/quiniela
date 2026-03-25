"use client"

import { Sun, Moon, Trophy } from "lucide-react"
import { useTheme } from "./theme-provider"
import type { CurrentUser } from "@/lib/types"

interface HeaderProps {
  user: CurrentUser
  tournamentName: string
  userPoints: number
  onAvatarClick: () => void
}

export function Header({ user, tournamentName, userPoints, onAvatarClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button
          onClick={onAvatarClick}
          className="flex items-center gap-3 rounded-xl px-1 py-1 transition-colors hover:bg-secondary/60"
          aria-label="Abrir mi perfil"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar}
            alt={`Avatar de ${user.name}`}
            className="h-9 w-9 rounded-full border-2 border-primary bg-secondary"
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-foreground">
              {user.name}
            </span>
            <span className="text-xs leading-tight text-muted-foreground">
              {userPoints} pts
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex">
            <Trophy className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">{tournamentName}</span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-muted"
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
