import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/resend";
import { CONTACT_EMAIL } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, email y mensaje son requeridos" },
        { status: 400 }
      );
    }

    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "APTO <noreply@apto.org.mx>",
      to: CONTACT_EMAIL,
      replyTo: email,
      subject: subject || `Contacto de ${name}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject || "Sin asunto"}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Error sending message" },
      { status: 500 }
    );
  }
}
