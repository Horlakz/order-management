import { IQueue } from '@/lib/interfaces/event';

type EMAIL_QUEUE_JOBS = 'SEND_EMAIL';
export const EMAIL_QUEUE: IQueue<EMAIL_QUEUE_JOBS> = {
  PROCESSOR: {
    NAME: 'email-processor',
  },
  JOBS: {
    SEND_EMAIL: 'send-email',
  },
};
