#!/usr/bin/env node
/**
 * JobTrack — Manual & Scheduled Ingestion Trigger CLI
 * ===================================================
 * Can be executed locally, in CI/CD, or via scheduled runners:
 *   npm run ingest:manual
 *   npm run ingest:status
 *   npm run ingest:manual -- --force
 *   npm run ingest:manual -- --providers=remotive,greenhouse
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  triggerIngestion,
  getIngestionStatus,
  DEFAULT_INGESTION_CRON,
  explainCronCadence,
} from '../src/services/ingestionScheduler.ts'

// Simple .env parser to load local credentials if present in .env or .env.local
function loadLocalEnvFiles(): void {
  const cwd = process.cwd()
  const files = ['.env.local', '.env']
  for (const file of files) {
    const fullPath = path.join(cwd, file)
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8')
        for (const line of content.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eqIdx = trimmed.indexOf('=')
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim()
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
            if (!process.env[key]) {
              process.env[key] = val
            }
          }
        }
      } catch {
        // Silently skip unreadable env files
      }
    }
  }
}

loadLocalEnvFiles()

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const isStatusOnly = args.includes('--status')
  const force = args.includes('--force')

  let providers: string[] | undefined
  const providerArg = args.find((a) => a.startsWith('--providers='))
  if (providerArg) {
    providers = providerArg.split('=')[1].split(',').map((p) => p.trim().toLowerCase())
  }

  const timeoutArg = args.find((a) => a.startsWith('--timeout='))
  const timeoutMs = timeoutArg ? parseInt(timeoutArg.split('=')[1], 10) : undefined

  console.log('='.repeat(60))
  console.log('  JobTrack — Job Ingestion Runner & Status')
  console.log('='.repeat(60))
  console.log(`Cadence: ${DEFAULT_INGESTION_CRON} (${explainCronCadence(DEFAULT_INGESTION_CRON)})`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log('-'.repeat(60))

  if (isStatusOnly) {
    console.log('\n[Status Check]')
    const status = await getIngestionStatus()
    console.log(`Overall Health: ${status.overallHealth.toUpperCase()}`)
    console.log(`Active Run in Progress: ${status.isActiveRunInProgress ? 'YES' : 'NO'}`)
    if (status.activeRun) {
      console.log(`  Run ID: ${status.activeRun.id}`)
      console.log(`  Source: ${status.activeRun.source}`)
      console.log(`  Started: ${status.activeRun.startedAt}`)
    }

    console.log('\nConfigured Providers:')
    console.table(
      status.sources.map((s) => ({
        Provider: s.name,
        Enabled: s.isEnabled ? 'Yes' : 'No',
        'Cadence (min)': s.fetchIntervalMinutes,
        'Last Run': s.lastRunAt || 'Never',
        'Last Success': s.lastSuccessAt || 'Never',
        'Last Error': s.lastError || 'None',
      })),
    )
    return
  }

  console.log(`\nTriggering ingestion sweep across: ${(providers || ['remotive', 'greenhouse', 'adzuna']).join(', ')}...`)
  if (force) {
    console.log('[Notice] Overlap check bypassed via --force')
  }

  const startTime = Date.now()
  const result = await triggerIngestion({
    providers,
    force,
    timeoutMs,
  })

  const elapsed = Date.now() - startTime

  if (result.skipped) {
    console.warn(`\n[SKIPPED] ${result.skipReason}`)
    console.log(`Elapsed: ${elapsed}ms`)
    process.exit(2)
  }

  if (!result.success && result.error) {
    console.error(`\n[ERROR] Ingestion run failed: ${result.error}`)
    process.exit(1)
  }

  console.log(`\n[COMPLETED] Run ID: ${result.runId} (${result.executionMode})`)
  console.log(`Total duration: ${result.totalDurationMs || elapsed}ms`)
  console.log('\nSummary Metrics:')
  console.table([
    {
      'Fetched': result.totals.fetched,
      'Valid': result.totals.valid,
      'Deduplicated': result.totals.deduplicated,
      'Inserted': result.totals.inserted,
      'Updated': result.totals.updated,
      'Failed': result.totals.failed,
    },
  ])

  console.log('\nProvider Results:')
  const providerRows = Object.values(result.providers).map((p) => ({
    Provider: p.provider,
    Status: p.status.toUpperCase(),
    Duration: `${p.durationMs}ms`,
    Fetched: p.fetchedCount,
    Valid: p.validCount,
    Inserted: p.insertedCount,
    Updated: p.updatedCount,
    Error: p.errorMessage || 'None',
  }))

  if (providerRows.length > 0) {
    console.table(providerRows)
  } else {
    console.log('No providers returned individual summaries.')
  }

  const hasFailures = Object.values(result.providers).some((p) => p.status === 'failed')
  if (hasFailures) {
    console.warn('\nNote: One or more providers reported failures (fault isolation active).')
  }

  console.log('\nIngestion completed successfully.')
}

main().catch((err) => {
  console.error('[Fatal Ingestion Error]:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
