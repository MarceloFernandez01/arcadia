import { NextResponse } from "next/server";
import { Resend } from "resend";

type ContactPayload = { name: string; email: string; message: string };

export async function POST(request: Request) {
  const { name, email, message } = (await request.json()) as Partial<ContactPayload>;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ ok: false, error: "Faltan campos requeridos." }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    // TODO: volver a "no-reply@arcadevault.gg" cuando el dominio esté verificado en Resend.
    from: "onboarding@resend.dev",
    to: process.env.CONTACT_TO_EMAIL!,
    replyTo: email,
    subject: `Nuevo mensaje de contacto de ${name}`,
    text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
