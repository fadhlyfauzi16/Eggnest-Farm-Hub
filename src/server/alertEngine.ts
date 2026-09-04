import { randomUUID } from 'crypto';
import { queryAll, queryOne, runSql } from './db';

function getSetting(
  db: any,
  key: string,
  fallback: number
): number {
  const row = queryOne<{ value: string }>(
    db,
    `SELECT value FROM system_settings WHERE key = ?`,
    [key]
  );

  if (!row) return fallback;

  try {
    const parsed = JSON.parse(row.value);
    const value = Number(parsed);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    const value = Number(row.value);
    return Number.isFinite(value) ? value : fallback;
  }
}

function daysBetween(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();

  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function resolveAlert(db: any, farmId: string, type: string) {
  const existing = queryOne<any>(
    db,
    `
      SELECT id
      FROM alerts
      WHERE farm_id = ?
        AND type = ?
        AND resolved = 0
      LIMIT 1
    `,
    [farmId, type]
  );

  if (!existing) return;

  runSql(
    db,
    `
      UPDATE alerts
      SET resolved = 1,
          status = 'resolved',
          resolved_at = ?
      WHERE id = ?
    `,
    [new Date().toISOString(), existing.id]
  );
}

function createAlert(
  db: any,
  farm: any,
  type: string,
  severity: 'critical' | 'warning' | 'info',
  title: string,
  description: string,
  dataSummary?: string,
  actionText = 'HUBUNGI MEMBER'
) {
  const existing = queryOne<any>(
    db,
    `
      SELECT id
      FROM alerts
      WHERE farm_id = ?
        AND type = ?
        AND resolved = 0
      LIMIT 1
    `,
    [farm.id, type]
  );

  if (existing) return;

  runSql(
    db,
    `
      INSERT INTO alerts (
        id,
        farm_id,
        farm_code,
        owner_name,
        type,
        severity,
        title,
        description,
        data_summary,
        action_text,
        status,
        resolved,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 0, ?)
    `,
    [
      randomUUID(),
      farm.id,
      farm.farm_code,
      farm.owner_name,
      type,
      severity,
      title,
      description,
      dataSummary || null,
      actionText,
      new Date().toISOString(),
    ]
  );
}

function evaluateFarm(db: any, farm: any) {
  const warningDropThreshold = getSetting(
    db,
    'warningDropThreshold',
    15
  );

  const criticalDropThreshold = getSetting(
    db,
    'criticalDropThreshold',
    30
  );

  const warningMissedDays = getSetting(
    db,
    'warningMissedReportDays',
    3
  );

  const criticalMissedDays = getSetting(
    db,
    'criticalMissedReportDays',
    4
  );

  const latestReport = queryOne<any>(
    db,
    `
      SELECT *
      FROM daily_reports
      WHERE farm_id = ?
      ORDER BY report_date DESC
      LIMIT 1
    `,
    [farm.id]
  );

  /*
   * =====================================================
   * 1. MISSED DAILY REPORT
   * =====================================================
   */

  const referenceDate =
    latestReport?.report_date ||
    farm.activation_date ||
    farm.created_at;

  if (referenceDate) {
    const missedDays = daysBetween(referenceDate);

    if (missedDays >= criticalMissedDays) {
      resolveAlert(db, farm.id, 'missed_report_warning');

      createAlert(
        db,
        farm,
        'missed_report_critical',
        'critical',
        `Laporan ${farm.farm_code} Belum Masuk`,
        `Member belum mengirim laporan kandang selama ${missedDays} hari.`,
        `${missedDays} hari tanpa laporan`,
        'HUBUNGI MEMBER'
      );
    } else if (missedDays >= warningMissedDays) {
      resolveAlert(db, farm.id, 'missed_report_critical');

      createAlert(
        db,
        farm,
        'missed_report_warning',
        'warning',
        `Laporan ${farm.farm_code} Terlambat`,
        `Member belum mengirim laporan kandang selama ${missedDays} hari.`,
        `${missedDays} hari tanpa laporan`,
        'INGATKAN MEMBER'
      );
    } else {
      resolveAlert(db, farm.id, 'missed_report_warning');
      resolveAlert(db, farm.id, 'missed_report_critical');
    }
  }

  /*
   * =====================================================
   * 2. PRODUCTION DROP
   * =====================================================
   */

  if (!latestReport) {
    resolveAlert(db, farm.id, 'production_drop_warning');
    resolveAlert(db, farm.id, 'production_drop_critical');
    return;
  }

  const activeChickens = Number(farm.active_chickens || 0);
  const eggCount = Number(latestReport.egg_count || 0);

  if (activeChickens <= 0) return;

  const productivity =
    (eggCount / activeChickens) * 100;

  const dropPercentage =
    Math.max(0, 100 - productivity);

  if (dropPercentage >= criticalDropThreshold) {
    resolveAlert(db, farm.id, 'production_drop_warning');

    createAlert(
      db,
      farm,
      'production_drop_critical',
      'critical',
      `Produksi ${farm.farm_code} Turun Kritis`,
      `Produksi terakhir ${eggCount} butir dari ${activeChickens} ayam aktif.`,
      `${Math.round(productivity)}% produktivitas`,
      'LIHAT FARM'
    );
  } else if (dropPercentage >= warningDropThreshold) {
    resolveAlert(db, farm.id, 'production_drop_critical');

    createAlert(
      db,
      farm,
      'production_drop_warning',
      'warning',
      `Produksi ${farm.farm_code} Menurun`,
      `Produksi terakhir ${eggCount} butir dari ${activeChickens} ayam aktif.`,
      `${Math.round(productivity)}% produktivitas`,
      'PANTAU FARM'
    );
  } else {
    resolveAlert(db, farm.id, 'production_drop_warning');
    resolveAlert(db, farm.id, 'production_drop_critical');
  }

  /*
   * =====================================================
   * 3. HEALTH ISSUE
   * =====================================================
   */

  if (latestReport.chicken_condition === 'issue') {
    createAlert(
      db,
      farm,
      'health_issue',
      'warning',
      `Kondisi Ayam Perlu Perhatian — ${farm.farm_code}`,
      `Laporan terbaru menunjukkan adanya masalah pada kondisi ayam.`,
      latestReport.issue_types || undefined,
      'LIHAT LAPORAN'
    );
  } else {
    resolveAlert(db, farm.id, 'health_issue');
  }
}

/**
 * Smart Alert Engine
 *
 * evaluateSmartAlerts(db)
 *   -> evaluasi semua farm aktif
 *
 * evaluateSmartAlerts(db, farmId)
 *   -> evaluasi satu farm
 */
export function evaluateSmartAlerts(
  db: any,
  farmId?: string
): void {
  try {
    let farms: any[] = [];

    if (farmId) {
      const farm = queryOne<any>(
        db,
        `
          SELECT *
          FROM farms
          WHERE id = ?
          LIMIT 1
        `,
        [farmId]
      );

      if (farm) farms = [farm];
    } else {
      farms = queryAll<any>(
        db,
        `
          SELECT *
          FROM farms
          WHERE status NOT IN (
            'unclaimed',
            'inactive',
            'completed'
          )
        `
      );
    }

    for (const farm of farms) {
      evaluateFarm(db, farm);
    }
  } catch (error) {
    console.error(
      '[Smart Alert Engine] Evaluation failed:',
      error
    );
  }
}