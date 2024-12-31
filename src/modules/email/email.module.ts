import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';
import { EMAIL_QUEUE } from '../../lib/constants/event';
import { EmailConsumer } from './email.processor';
import { EmailService } from './email.service';

const providers = [EmailService];

@Global()
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: EMAIL_QUEUE.PROCESSOR.NAME }),
  ],
  providers: [...providers, EmailConsumer],
  exports: [...providers],
})
export class EmailModule {}
