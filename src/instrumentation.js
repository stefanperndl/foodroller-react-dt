import { registerOTel } from '@vercel/otel'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'foodroller',
    traceExporter: new OTLPTraceExporter(),
  })
}
