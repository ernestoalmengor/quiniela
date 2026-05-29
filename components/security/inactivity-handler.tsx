"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutos en milisegundos

export function InactivityHandler() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (session) {
      timerRef.current = setTimeout(() => {
        // Cerrar sesión tras inactividad
        signOut({ callbackUrl: "/login" });
      }, INACTIVITY_LIMIT);
    }
  };

  useEffect(() => {
    // Si no hay sesión o estamos en la página de login, no activar
    if (!session || pathname === "/login") {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    // Eventos a monitorear para detectar actividad humana
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Inicializar timer
    resetTimer();

    // Agregar manejadores
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Limpieza al desmontar
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [session, pathname]);

  return null;
}
