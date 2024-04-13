import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'

export default {
  conf: {
    enabled: false
  },
  sdk: null,
  isStarted: false,
  /**
   * Initialize Instrumentation
   */
  initialize () {
    this.loadConfig()
    this.sdk = new NodeSDK({
      serviceName: 'draftforge',
      traceExporter: new OTLPTraceExporter({
        url: 'https://heimdall-otlp.ietf.org/v1/traces',
        // optional - collection of custom headers to be sent with each request, empty by default
        headers: {}
      }),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter()
      }),
      instrumentations: []
    })

    if (this.conf.enabled) {
      console.info('Instrumentation is enabled.')
      this.sdk.start()
      this.isStarted = true
    }
  },
  /**
   * Starts the instrumentation
   */
  start () {
    if (!this.isStarted) {
      this.sdk.start()
      this.isStarted = true
      console.info('Instrumentation is now enabled.')
    } else {
      console.warn('Instrumentation is already enabled.')
    }
  },
  /**
   * Stops the instrumentation
   */
  stop () {
    if (this.isStarted) {
      this.sdk.shutdown()
      this.isStarted = false
      console.info('Instrumentation is now disabled.')
    } else {
      console.warn('Instrumentation is already disabled.')
    }
  },
  /**
   * Load configuration from disk
   */
  loadConfig () {
    const confPath = path.join(app.getPath('userData'), 'draftforge-instrconf.json')
    try {
      const confFromDisk = JSON.parse(fs.readFileSync(confPath, 'utf8'))
      if (confFromDisk) {
        this.conf = {
          ...this.conf,
          ...confFromDisk
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('No instrumentation config exists yet. [ OK ]')
      } else {
        console.log(`Failed to read instrumentation config. [${err.message}]`)
      }
    }
  },
  /**
   * Save configuration to disk
   */
  async saveConfig () {
    const confPath = path.join(app.getPath('userData'), 'draftforge-instrconf.json')
    try {
      await fs.writeFileSync(confPath, JSON.stringify({
        enabled: this.conf.enabled ?? false
      }, null, 2), 'utf8')
    } catch (err) {
      console.log(`Failed to write instrumentation config to disk. [${err.message}]`)
    }
  }
}
