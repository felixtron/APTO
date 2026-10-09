import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isResetTokenCurrent, verifyPasswordResetToken } from "@/lib/password-reset";
import { checkRateLimit, getClientIp, tooManyRequests } from "@/lib/rate-limit";

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 12;

function invalidToken() {
  return NextResponse.json({ error: "Token inválido." }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const limit = checkRateLimit("passwordResetConfirm", [getClientIp(request.headers)]);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const { token, password } = await request.json();

    if (!token || !password || typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos." },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
        { status: 400 }
      );
    }

    const verified = verifyPasswordResetToken(token);
    if (!verified.ok) {
      return verified.reason === "expired"
        ? NextResponse.json(
            { error: "El enlace ha expirado. Solicita uno nuevo." },
            { status: 400 }
          )
        : invalidToken();
    }

    const member = await prisma.member.findUnique({
      where: { email: verified.email },
      select: { id: true, passwordHash: true },
    });

    // Token is bound to the password hash it was issued for: once used
    // (or if the password changed since), it no longer matches.
    if (!member || !isResetTokenCurrent(verified, member.passwordHash)) {
      return NextResponse.json(
        { error: "Este enlace ya fue usado o no es válido. Solicita uno nuevo." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    await prisma.member.update({
      where: { id: member.id },
      data: { passwordHash, passwordSetAt: new Date() },
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
