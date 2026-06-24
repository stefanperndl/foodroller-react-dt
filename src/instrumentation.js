import { registerOTel } from '@vercel/otel'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'

export function register() {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)

  const exporter = new OTLPTraceExporter()
  console.log('[otel] endpoint:', process.env.OTEL_EXPORTER_OTLP_ENDPOINT)
  console.log('[otel] headers set:', !!process.env.OTEL_EXPORTER_OTLP_HEADERS)

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'foodroller',
    traceExporter: exporter,
  })
}
