export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')
    const { SimpleSpanProcessor } = await import('@opentelemetry/sdk-trace-node')

    const sdk = new NodeSDK({
      spanProcessors: [new SimpleSpanProcessor(new OTLPTraceExporter())],
      instrumentations: [getNodeAutoInstrumentations()],
    })

    sdk.start()
  }
}
