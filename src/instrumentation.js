export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { diag, DiagConsoleLogger, DiagLogLevel } = await import('@opentelemetry/api')
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN)

    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')
    const { SimpleSpanProcessor } = await import('@opentelemetry/sdk-trace-node')

    console.log('[otel] register() called, endpoint:', process.env.OTEL_EXPORTER_OTLP_ENDPOINT)

    const sdk = new NodeSDK({
      spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter())],
      instrumentations: [getNodeAutoInstrumentations()],
    })

    sdk.start()
  }
}
