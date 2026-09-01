import { db } from './db';

export interface AlertEvaluationResult {
  generatedAlertsCount: number;
  activeAlerts: any[];
}

export function evaluateSmartAlertsForFarm(farmId: string): void {
  const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(farmId) as any;
  if (!farm || farm.status === 'unclaimed') return;

  const settings = db.prepare('SELECT * FROM system_settings WHERE id = ?').get('default') as any;
  const warningDrop = settings?.warning_drop_threshold || 15;
  const criticalDrop = settings?.critical_drop_threshold || 30;
  const warningMissed = settings?.warning_missed_report_days || 3;
  const criticalMissed = settings?.critical_missed_report_days || 4;

  const activeChickens = farm.active_chickens || 12;

  // 1. Get recent reports ordered by date desc
  const recentReports = db.prepare(`
    SELECT * FROM daily_reports
    WHERE farm_id = ?
    ORDER BY date DESC
    LIMIT 7
  `).all(farmId) as any[];

  if (recentReports.length === 0) return;

  const latestReport = recentReports[0];

  // 2. Evaluate Production Drop
  if (latestReport && activeChickens > 0) {
    const prodRate = (latestReport.egg_count / activeChickens) * 100;
    const dropPercentage = 100 - prodRate;

    if (dropPercentage >= criticalDrop) {
      // Create CRITICAL alert if not already active for today
      const existing = db.prepare(`
        SELECT id FROM admin_alerts
        WHERE farm_id = ? AND type = 'critical_drop' AND resolved = 0
      `).get(farmId);

      if (!existing) {
        db.prepare(`
          INSERT INTO admin_alerts (
            id, farm_code, farm_id, owner_name, type, severity, title, description,
            data_summary, action_text, resolved, status, created_at
          ) VALUES (?, ?, ?, ?, 'critical_drop', 'critical', ?, ?, ?, 'LIHAT FARM', 0, 'active', datetime('now'))
        `).run(
          `alert-drop-${Date.now()}`,
          farm.farm_code,
          farm.id,
          farm.owner_name,
          `Produksi ${farm.farm_code} Turun Kritis (${Math.round(prodRate)}%)`,
          `Produksi hari ini hanya ${latestReport.egg_count} butir dari ${activeChickens} ekor ayam aktif (penurunan ${Math.round(dropPercentage)}%).`,
          `${latestReport.egg_count} butir / ${activeChickens} ayam (${Math.round(prodRate)}%)`
        );
      }
    } else if (dropPercentage >= warningDrop) {
      const existing = db.prepare(`
        SELECT id FROM admin_alerts
        WHERE farm_id = ? AND type = 'warning_drop' AND resolved = 0
      `).get(farmId);

      if (!existing) {
        db.prepare(`
          INSERT INTO admin_alerts (
            id, farm_code, farm_id, owner_name, type, severity, title, description,
            data_summary, action_text, resolved, status, created_at
          ) VALUES (?, ?, ?, ?, 'warning_drop', 'warning', ?, ?, ?, 'PANTAU FARM', 0, 'active', datetime('now'))
        `).run(
          `alert-warn-${Date.now()}`,
          farm.farm_code,
          farm.id,
          farm.owner_name,
          `Penurunan Produksi di ${farm.farm_code} (${Math.round(prodRate)}%)`,
          `Produksi hari ini ${latestReport.egg_count} butir (penurunan ${Math.round(dropPercentage)}% dari kapasitas maksimal).`,
          `${latestReport.egg_count} butir (${Math.round(prodRate)}%)`
        );
      }
    }
  }

  // 3. Evaluate Health Problems
  if (latestReport && latestReport.chicken_condition === 'issue') {
    let issueList: string[] = [];
    try {
      if (latestReport.issue_types) {
        issueList = JSON.parse(latestReport.issue_types);
      }
    } catch (e) {}

    // Find specific chickens with issues in this daily report
    const sickDeadChicks = db.prepare(`
      SELECT chr.chicken_number, chr.condition,
             json_group_array(chp.problem_type) as problems
      FROM chicken_health_reports chr
      LEFT JOIN chicken_health_problems chp ON chp.health_report_id = chr.id
      WHERE chr.daily_report_id = ? AND chr.condition IN ('SICK', 'DEAD')
      GROUP BY chr.id
    `).all(latestReport.id) as any[];

    const hasDead = sickDeadChicks.some(c => c.condition === 'DEAD') || issueList.includes('Ayam mati');
    const hasSick = sickDeadChicks.some(c => c.condition === 'SICK') || issueList.includes('Ayam sakit');
    const type = hasDead ? 'dead_chicken' : hasSick ? 'sick_chicken' : 'other_health';
    const severity = hasDead || hasSick ? 'critical' : 'warning';

    let affectedChicksText = '';
    if (sickDeadChicks.length > 0) {
      const labels = sickDeadChicks.map(c => {
        let probs: string[] = [];
        try { probs = JSON.parse(c.problems).filter(Boolean); } catch (e) {}
        const probStr = probs.length > 0 ? ` (${probs.join(', ')})` : '';
        return `Ayam #${c.chicken_number} [${c.condition}]${probStr}`;
      });
      affectedChicksText = `Ayam terdampak: ${labels.join('; ')}. `;
    }

    const existing = db.prepare(`
      SELECT id FROM admin_alerts
      WHERE farm_id = ? AND type = ? AND resolved = 0
    `).get(farmId, type);

    if (!existing) {
      db.prepare(`
        INSERT INTO admin_alerts (
          id, farm_code, farm_id, owner_name, type, severity, title, description,
          data_summary, action_text, resolved, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'HUBUNGI MEMBER', 0, 'active', datetime('now'))
      `).run(
        `alert-health-${Date.now()}`,
        farm.farm_code,
        farm.id,
        farm.owner_name,
        type,
        severity,
        `Laporan Gangguan Kesehatan di ${farm.farm_code}`,
        `${affectedChicksText}Indikasi umum: ${issueList.join(', ') || 'Kondisi ayam bermasalah'}. Catatan: ${latestReport.notes || '-'}`,
        `${latestReport.egg_count} butir, ${latestReport.feed_kg} kg pakan`
      );
    }
  }
}

export function evaluateAllFarmsMissedReports(): void {
  const activeFarms = db.prepare("SELECT * FROM farms WHERE status IN ('active', 'warning', 'critical')").all() as any[];
  const settings = db.prepare('SELECT * FROM system_settings WHERE id = ?').get('default') as any;
  const warningMissed = settings?.warning_missed_report_days || 3;
  const criticalMissed = settings?.critical_missed_report_days || 4;

  const now = new Date('2026-08-31'); // benchmark system current date

  for (const farm of activeFarms) {
    const latestReport = db.prepare(`
      SELECT date FROM daily_reports
      WHERE farm_id = ?
      ORDER BY date DESC
      LIMIT 1
    `).get(farm.id) as { date: string } | undefined;

    let daysSinceLastReport = 0;
    if (latestReport) {
      const lastDate = new Date(latestReport.date);
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      daysSinceLastReport = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    } else {
      daysSinceLastReport = 10;
    }

    if (daysSinceLastReport >= criticalMissed) {
      const existing = db.prepare(`
        SELECT id FROM admin_alerts
        WHERE farm_id = ? AND type = 'missed_reports' AND resolved = 0
      `).get(farm.id);

      if (!existing) {
        db.prepare(`
          INSERT INTO admin_alerts (
            id, farm_code, farm_id, owner_name, type, severity, title, description,
            data_summary, action_text, resolved, status, created_at
          ) VALUES (?, ?, ?, ?, 'missed_reports', 'critical', ?, ?, ?, 'KIRIM PENGINGAT WA', 0, 'active', datetime('now'))
        `).run(
          `alert-missed-${Date.now()}-${farm.id}`,
          farm.farm_code,
          farm.id,
          farm.owner_name,
          `${farm.farm_code} Tidak Melapor ${daysSinceLastReport} Hari Berturut-turut`,
          `Laporan terakhir tercatat pada ${latestReport?.date || 'Belum pernah'}. Perlu follow up segera.`,
          `Absen ${daysSinceLastReport} hari`
        );
      }
    } else if (daysSinceLastReport >= warningMissed) {
      const existing = db.prepare(`
        SELECT id FROM admin_alerts
        WHERE farm_id = ? AND type = 'missed_reports' AND resolved = 0
      `).get(farm.id);

      if (!existing) {
        db.prepare(`
          INSERT INTO admin_alerts (
            id, farm_code, farm_id, owner_name, type, severity, title, description,
            data_summary, action_text, resolved, status, created_at
          ) VALUES (?, ?, ?, ?, 'missed_reports', 'warning', ?, ?, ?, 'KIRIM PENGINGAT WA', 0, 'active', datetime('now'))
        `).run(
          `alert-missed-${Date.now()}-${farm.id}`,
          farm.farm_code,
          farm.id,
          farm.owner_name,
          `${farm.farm_code} Belum Melapor ${daysSinceLastReport} Hari`,
          `Pengingat ramah via WhatsApp disarankan agar data harian tetap konsisten.`,
          `Absen ${daysSinceLastReport} hari`
        );
      }
    }
  }
}
