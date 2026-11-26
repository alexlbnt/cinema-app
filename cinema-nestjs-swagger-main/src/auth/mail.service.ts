import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

export interface Email {
  para: string;
  assunto: string;
  texto: string;
}

/**
 * Envia e-mails por SMTP quando SMTP_HOST está configurado no .env.
 * Sem SMTP (desenvolvimento), escreve o e-mail no console do servidor.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  async enviar(email: Email): Promise<void> {
    const host = process.env.SMTP_HOST;
    if (!host) {
      this.logger.warn(
        `SMTP não configurado — e-mail não enviado.\n` +
          `Para: ${email.para}\nAssunto: ${email.assunto}\n\n${email.texto}`,
      );
      return;
    }

    if (!this.transporter) {
      const port = Number(process.env.SMTP_PORT) || 587;
      this.transporter = createTransport({
        host,
        port,
        secure: port === 465,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email.para,
      subject: email.assunto,
      text: email.texto,
    });
  }
}
