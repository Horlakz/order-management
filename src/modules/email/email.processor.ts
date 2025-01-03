import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { EMAIL_QUEUE } from '../../lib/constants/event';
import { EmailService } from './email.service';

@Processor(EMAIL_QUEUE.PROCESSOR.NAME)
export class EmailConsumer extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job) {
    return await this.emailService.sendEmail(job.data);
  }
}
