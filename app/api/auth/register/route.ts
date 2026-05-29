import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: "Todos los campos son obligatorios" }, { status: 400 });
    }

    // Sanitizar y validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ message: "Formato de correo electrónico inválido." }, { status: 400 });
    }

    // Validar contraseña robusta
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-\[\]\{\}\(\)\|\+\=\*\/\^\#])[A-Za-z\d@$!%*?&._\-\[\]\{\}\(\)\|\+\=\*\/\^\#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ message: "La contraseña no cumple con los requisitos de seguridad." }, { status: 400 });
    }

    // Verificar si el correo ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Este correo ya está registrado." }, { status: 400 });
    }

    // Limpiar espacios y acentos básicos para el username (simplificado)
    const sanitizedFirst = firstName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const sanitizedLast = lastName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    
    let username = "";
    let iterador = 1;
    let isTaken = true;

    // Lógica para crear un username único (ej. mlopez -> malopez -> marlopez)
    while (isTaken) {
      if (iterador > sanitizedFirst.length) {
         // Si se acaba el nombre y todos están ocupados, agregar número
         username = `${sanitizedFirst}${sanitizedLast}${Math.floor(Math.random() * 1000)}`;
      } else {
         const prefijo = sanitizedFirst.substring(0, iterador);
         username = `${prefijo}${sanitizedLast}`;
      }

      const checkUsername = await prisma.user.findUnique({
        where: { username }
      });

      if (!checkUsername) {
        isTaken = false; // Libre para usarse
      } else {
        iterador++; // El username ya existe, intentamos con la siguiente letra del primer nombre
      }
    }

    // Encriptar la contraseña (jamás guardar en texto plano por seguridad)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        username,
        password: hashedPassword,
        // El field internalCode se auto-genera con cuid() (UUID) por defecto oculto
      }
    });

    return NextResponse.json(
      { message: "Cuenta creada exitosamente.", username },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ message: "Ocurrió un error interno." }, { status: 500 });
  }
}
