import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PlatformIcon, getPlatformName, getPlatformColor } from '../utils/platformConfig';

/**
 * ContributionCalendar - Exact LeetCode-style contribution heatmap
 * Large green rounded cells, month labels at bottom, fire 🔥 badges, no scrollbar
 */
const ContributionCalendar = ({ calendarData, connectedPlatforms = [] }) => {
  const containerRef = useRef(null);
  const [cellPx, setCellPx] = useState(13);

  // ── empty state ──
  if (!calendarData?.calendar?.length) {
    return (
      <div style={{ width: '100%' }}>
        <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Contribution Activity
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#6b7280', fontSize: 14 }}>
          No contribution data yet. Link your platforms and sync!
        </div>
      </div>
    );
  }

  const { calendar, stats } = calendarData;
  const GAP = 3;

  // ── build week columns (Sun-Sat) ──
  const weeks = useMemo(() => {
    const out = [];
    let week = [];
    const dow = new Date(calendar[0].date + 'T00:00:00').getDay();
    for (let i = 0; i < dow; i++) week.push(null);
    for (const d of calendar) {
      week.push(d);
      if (week.length === 7) { out.push(week); week = []; }
    }
    if (week.length) { while (week.length < 7) week.push(null); out.push(week); }
    return out;
  }, [calendar]);

  // ── auto-size cells to fit container ──
  useEffect(() => {
    const calc = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      const n = weeks.length || 53;
      const sz = Math.floor((w - (n - 1) * GAP) / n);
      setCellPx(Math.max(7, Math.min(15, sz)));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [weeks.length]);

  // ── LeetCode green palette ──
  const COLOR = ['#2d333b', '#0e4429', '#006d32', '#26a641', '#39d353'];

  // ── tooltip ──
  const tip = (day) => {
    if (!day) return '';
    const s = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!day.count) return `No submissions on ${s}`;
    const p = [];
    if (day.problems) p.push(`${day.problems} problem${day.problems > 1 ? 's' : ''}`);
    if (day.commits) p.push(`${day.commits} commit${day.commits > 1 ? 's' : ''}`);
    return `${day.count} contribution${day.count > 1 ? 's' : ''} on ${s}${p.length ? ` (${p.join(', ')})` : ''}`;
  };

  // ── month boundaries (for labels below the grid) ──
  const months = useMemo(() => {
    const labels = [];
    const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let prev = -1;
    weeks.forEach((wk, wi) => {
      const first = wk.find(d => d);
      if (!first) return;
      const dt = new Date(first.date + 'T00:00:00');
      const m = dt.getMonth();
      if (m !== prev) {
        labels.push({ wi, label: MN[m], m, y: dt.getFullYear() });
        prev = m;
      }
    });
    return labels;
  }, [weeks]);

  // ── fire badges: months where user was active every day ──
  const fireSet = useMemo(() => {
    const map = {};
    calendar.forEach(d => {
      const dt = new Date(d.date + 'T00:00:00');
      const k = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (!map[k]) map[k] = { tot: 0, act: 0 };
      map[k].tot++;
      if (d.count > 0) map[k].act++;
    });
    const s = new Set();
    Object.entries(map).forEach(([k, v]) => { if (v.act === v.tot && v.tot > 0) s.add(k); });
    return s;
  }, [calendar]);

  const gridW = weeks.length * (cellPx + GAP) - GAP;

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {/* ── Header stats ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
            {(stats.totalContributions || 0).toLocaleString()}
          </span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>submissions in the past one year</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13, color: '#9ca3af', flexWrap: 'wrap' }}>
          <span>Total active days: <b style={{ color: '#fff' }}>{stats.activeDays || 0}</b></span>
          <span>Max streak: <b style={{ color: '#fff' }}>{stats.longestStreak || 0}</b></span>
          <span>Current streak: <b style={{ color: '#fff' }}>{stats.currentStreak || 0}</b></span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ width: '100%', overflowX: 'hidden', overflowY: 'visible' }}>
        {/* cells */}
        <div style={{ display: 'flex', gap: GAP, width: gridW }}>
          {weeks.map((wk, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {wk.map((day, di) => (
                <div
                  key={di}
                  title={tip(day)}
                  style={{
                    width: cellPx,
                    height: cellPx,
                    borderRadius: 3,
                    backgroundColor: day ? COLOR[day.level] : 'transparent',
                    cursor: day ? 'pointer' : 'default',
                  }}
                  onMouseEnter={e => { if (day) e.currentTarget.style.filter = 'brightness(1.3)'; }}
                  onMouseLeave={e => { if (day) e.currentTarget.style.filter = ''; }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* ── Month labels at BOTTOM of grid ── */}
        <div style={{ position: 'relative', width: gridW, height: 30, marginTop: 4 }}>
          {months.map((ml, i) => {
            const left = ml.wi * (cellPx + GAP);
            const key = `${ml.y}-${ml.m}`;
            const hasFire = fireSet.has(key);
            return (
              <div key={i} style={{ position: 'absolute', left, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap', lineHeight: 1 }}>{ml.label}</span>
                {hasFire && <span style={{ fontSize: 10, lineHeight: 1 }}>🔥</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#8b949e', marginRight: 2 }}>Less</span>
        {COLOR.map((c, i) => (
          <div key={i} style={{ width: cellPx, height: cellPx, borderRadius: 3, backgroundColor: c }} />
        ))}
        <span style={{ fontSize: 10, color: '#8b949e', marginLeft: 2 }}>More</span>
      </div>

      {/* ── Connected Platforms ── */}
      {connectedPlatforms.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #2a2a3e' }}>
          {connectedPlatforms.map(p => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, backgroundColor: '#1a1a2e', border: '1px solid #2a2a3e' }}>
              <PlatformIcon platform={p.key} className="w-4 h-4" color={getPlatformColor(p.key)} />
              <span style={{ fontSize: 12, color: '#d1d5db', fontWeight: 500 }}>{getPlatformName(p.key)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContributionCalendar;
