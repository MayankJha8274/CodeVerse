import React, { useMemo, useRef, useEffect, useState } from 'react';
import { PlatformIcon, getPlatformName, getPlatformColor } from '../utils/platformConfig';
import { useTheme } from '../hooks/useCustomHooks';

/**
 * ContributionCalendar - Exact LeetCode-style contribution heatmap
 * Large green rounded cells, month labels at bottom, fire 🔥 badges, no scrollbar
 */
const ContributionCalendar = ({ calendarData, connectedPlatforms = [] }) => {
  const containerRef = useRef(null);
  const [cellPx, setCellPx] = useState(13);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ── empty state ──
  if (!calendarData?.calendar?.length) {
    return (
      <div style={{ width: '100%' }}>
        <p className="text-gray-900 dark:text-white text-base font-semibold mb-3">
          Contribution Activity
        </p>
        <div className="flex items-center justify-center h-30 text-gray-500 dark:text-gray-400 text-sm">
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

  // ── Theme-aware color palette ──
  const COLOR = isDark 
    ? ['#2d333b', '#0e4429', '#006d32', '#26a641', '#39d353']  // Dark mode - LeetCode green
    : ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']; // Light mode - lighter greens

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
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {(stats.totalContributions || 0).toLocaleString()}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">submissions in the past one year</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }} className="text-sm text-gray-600 dark:text-gray-400">
          <span>Total active days: <b className="text-gray-900 dark:text-white">{stats.activeDays || 0}</b></span>
          <span>Max streak: <b className="text-gray-900 dark:text-white">{stats.longestStreak || 0}</b></span>
          <span>Current streak: <b className="text-gray-900 dark:text-white">{stats.currentStreak || 0}</b></span>
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
                <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap leading-none">{ml.label}</span>
                {hasFire && <span style={{ fontSize: 10, lineHeight: 1 }}>🔥</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
        <span className="text-xs text-gray-500 dark:text-gray-500 mr-0.5">Less</span>
        {COLOR.map((c, i) => (
          <div key={i} style={{ width: cellPx, height: cellPx, borderRadius: 3, backgroundColor: c }} />
        ))}
        <span className="text-xs text-gray-500 dark:text-gray-500 ml-0.5">More</span>
      </div>

      {/* ── Connected Platforms ── */}
      {connectedPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          {connectedPlatforms.map(p => (
            <div key={p.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 transition-colors">
              <PlatformIcon platform={p.key} className="w-4 h-4" color={getPlatformColor(p.key)} />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{getPlatformName(p.key)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContributionCalendar;
