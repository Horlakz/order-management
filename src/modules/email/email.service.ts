import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import * as nodemailer from 'nodemailer';
import * as hbs from 'nodemailer-express-handlebars';

import env from '@/lib/constants/env';
import { EMAIL_QUEUE } from '@/lib/constants/event';
import { MailOptions } from '@/lib/interfaces/mail';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(EMAIL_QUEUE.PROCESSOR.NAME) private readonly mailQueue: Queue,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get(env.SMTP_HOST),
      port: this.configService.get<number>(env.SMTP_PORT),
      secure: true,
      auth: {
        user: this.configService.get(env.SMTP_USER),
        pass: this.configService.get(env.SMTP_PASS),
      },
    });

    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          partialsDir: './src/modules/email/templates/',
          layoutsDir: './src/modules/email/templates/',
        },
        viewPath: './src/modules/email/templates/',
        extName: '.hbs',
      }),
    );
  }

  async sendEmail(options: MailOptions) {
    if (!options.from) {
      options.from = `"Checkit" <${this.configService.get(env.EMAIL_FROM)}>`;
    }

    await this.transporter.sendMail(options);
  }

  async sendMailToQueue(data: MailOptions) {
    await this.mailQueue.add(EMAIL_QUEUE.JOBS.SEND_EMAIL, data, {
      removeOnComplete: true,
      removeOnFail: true,
    });
  }
}
