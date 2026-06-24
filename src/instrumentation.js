import { registerOTel } from '@vercel/otel'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function register() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  const headersStr = process.env.OTEL_EXPORTER_OTLP_HEADERS || ''
  const headers = Object.fromEntries(
    headersStr.split(',').filter(Boolean).map(h => {
      const idx = h.indexOf('=')
      return [h.slice(0, idx).trim(), h.slice(idx + 1).trim()]
    })
  )

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'foodroller',
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
      headers,
    }),
  })
}
