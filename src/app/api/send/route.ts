import * as React from 'react';
import { EmailTemplate } from '@/components/email-template';
import { Resend } from 'resend';

const resend = new Resend("process.env.RESEND_API_KEY");

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['dh.mukai.dh@gmail.com'],
      subject: '発注書を受信しました',
      react: EmailTemplate({ firstName: '' }) as React.ReactElement,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
