import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: 'https://9f5bee909b39645d392c7270b4a79af7@o4508445184360448.ingest.us.sentry.io/4508558638645248',
    integrations: [nodeProfilingIntegration()],
    // Tracing
    tracesSampleRate: 1.0, // Capture 100% of the transactions
  });

  // Manually call startProfiler and stopProfiler
  // to profile the code in between
  Sentry.profiler.startProfiler();

  // Starts a transaction that will also be profiled
  Sentry.startSpan(
    {
      name: 'My First Transaction',
    },
    () => {
      // the code executing inside the transaction will be wrapped in a span and profiled
    },
  );

  // Calls to stopProfiling are optional - if you don't stop the profiler, it will keep profiling
  // your application until the process exits or stopProfiling is called.
  Sentry.profiler.stopProfiler();
}
