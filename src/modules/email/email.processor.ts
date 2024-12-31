import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { EMAIL_QUEUE } from '../../lib/constants/event';
import { MailOptions } from '../../lib/interfaces/mail';
import { EmailService } from './email.service';

@Processor(EMAIL_QUEUE.PROCESSOR.NAME)
export class EmailConsumer extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    return await this.emailService.sendEmail(job.data);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<MailOptions>) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${job.id}: email sent to ${job.data.to}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    console.log(`${job.id}: email failed to send to ${job.data.to}`);
    console.error(error);
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job) {
    console.log(`Job ${job.id} stalled`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - Job ${job.id} active`);
  }
}
