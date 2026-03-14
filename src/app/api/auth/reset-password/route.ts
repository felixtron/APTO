import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Decode and verify token
    const parts = token.split(".");
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      );
    }

    const [payloadB64, signature] = parts;
    const secret = process.env.NEXTAUTH_SECRET!;

    let payload: string;
    try {
      payload = Buffer.from(payloadB64, "base64url").toString();
    } catch {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      );
    }

    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (signature !== expectedSig) {
      return NextResponse.json(
        { error: "Token inválido." },
        { status: 400 }
      );
    }

    const { email, exp } = JSON.parse(payload);

    if (Date.now() > exp) {
      return NextResponse.json(
        { error: "El enlace ha expirado. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update member
    await prisma.member.update({
      where: { email },
      data: { passwordHash },
    });

    return NextResponse.json(
      { message: "Contraseña actualizada correctamente." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Error al restablecer la contraseña." },
      { status: 500 }
    );
  }
}
