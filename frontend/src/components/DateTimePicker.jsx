import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const DateTimePicker = ({ value, onChange, label, required = false, minDate = null }) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('calendar'); // 'calendar' | 'time'
  const ref = useRef(null);

  // Parse value into date parts
  const parsed = value ? new Date(value) : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) : null);
  const [hours, setHours] = useState(parsed ? parsed.getHours() : 10);
  const [minutes, setMinutes] = useState(parsed ? parsed.getMinutes() : 0);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      setHours(d.getHours());
      setMinutes(d.getMinutes());
    }
  }, [value]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateClick = (day) => {
    const newDate = new Date(viewYear, viewMonth, day);
    if (minDate && newDate < new Date(new Date(minDate).setHours(0, 0, 0, 0))) return;
    setSelectedDate(newDate);
    setView('time');
  };

  const confirmDateTime = () => {
    if (!selectedDate) return;
    const dt = new Date(selectedDate);
    dt.setHours(hours, minutes, 0, 0);
    // Format as ISO for datetime-local compatibility
    const pad = (n) => String(n).padStart(2, '0');
    const isoStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    onChange(isoStr);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isToday = (day) => {
    const today = new Date();
    return viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();
  };

  const isSelected = (day) => {
    return selectedDate && viewYear === selectedDate.getFullYear() && viewMonth === selectedDate.getMonth() && day === selectedDate.getDate();
  };

  const isDisabled = (day) => {
    if (!minDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(new Date(minDate).setHours(0, 0, 0, 0));
  };

  const formatDisplay = () => {
    if (!value) return '';
    const d = new Date(value);
    const date = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date} · ${time}`;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && '*'}
        </label>
      )}
      <button
        type="button"
        onClick={() => { setOpen(!open); setView('calendar'); }}
        className={`w-full px-3 py-2.5 bg-gray-50 dark:bg-[#111118] border rounded-lg text-sm text-left flex items-center gap-2 transition-colors ${
          open ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-gray-200 dark:border-gray-800'
        } ${value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
      >
        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="flex-1 truncate">{formatDisplay() || 'Select date & time...'}</span>
        {value && (
          <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange(''); }} />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-[320px] bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Tab toggle */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button type="button" onClick={() => setView('calendar')}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                view === 'calendar' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}>
              <Calendar className="w-3.5 h-3.5" /> Date
            </button>
            <button type="button" onClick={() => setView('time')}
              className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                view === 'time' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}>
              <Clock className="w-3.5 h-3.5" /> Time
            </button>
          </div>

          {view === 'calendar' ? (
            <div className="p-3">
              {/* Month/Year nav */}
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {MONTHS[viewMonth]} {viewYear}
                </span>
                <button type="button" onClick={nextMonth} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const disabled = isDisabled(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => !disabled && handleDateClick(day)}
                      disabled={disabled}
                      className={`h-9 rounded-lg text-xs font-medium transition-all ${
                        isSelected(day)
                          ? 'bg-amber-500 text-black shadow-sm'
                          : isToday(day)
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                            : disabled
                              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Selected date display */}
              {selectedDate && (
                <div className="text-center mb-4">
                  <div className="text-xs text-gray-400">Selected Date</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              )}

              {/* Time picker */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="flex flex-col items-center">
                  <label className="text-[10px] text-gray-400 mb-1 font-medium">HOUR</label>
                  <div className="flex flex-col items-center">
                    <button type="button" onClick={() => setHours(h => (h + 1) % 24)}
                      className="p-1 text-gray-400 hover:text-amber-500">
                      <ChevronLeft className="w-4 h-4 rotate-90" />
                    </button>
                    <div className="w-14 h-12 bg-gray-100 dark:bg-[#111118] rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white">
                      {String(hours).padStart(2, '0')}
                    </div>
                    <button type="button" onClick={() => setHours(h => h <= 0 ? 23 : h - 1)}
                      className="p-1 text-gray-400 hover:text-amber-500">
                      <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>

                <span className="text-2xl font-bold text-gray-400 mt-4">:</span>

                <div className="flex flex-col items-center">
                  <label className="text-[10px] text-gray-400 mb-1 font-medium">MIN</label>
                  <div className="flex flex-col items-center">
                    <button type="button" onClick={() => setMinutes(m => (m + 5) % 60)}
                      className="p-1 text-gray-400 hover:text-amber-500">
                      <ChevronLeft className="w-4 h-4 rotate-90" />
                    </button>
                    <div className="w-14 h-12 bg-gray-100 dark:bg-[#111118] rounded-lg flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white">
                      {String(minutes).padStart(2, '0')}
                    </div>
                    <button type="button" onClick={() => setMinutes(m => m <= 0 ? 55 : m - 5)}
                      className="p-1 text-gray-400 hover:text-amber-500">
                      <ChevronLeft className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center mt-4">
                  <div className="text-xs text-gray-400 mb-1">
                    {hours >= 12 ? 'PM' : 'AM'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {`${hours > 12 ? hours - 12 : hours === 0 ? 12 : hours}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`}
                  </div>
                </div>
              </div>

              {/* Quick time buttons */}
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                {[
                  { label: '9 AM', h: 9, m: 0 },
                  { label: '12 PM', h: 12, m: 0 },
                  { label: '2 PM', h: 14, m: 0 },
                  { label: '5 PM', h: 17, m: 0 },
                  { label: '7 PM', h: 19, m: 0 },
                  { label: '9 PM', h: 21, m: 0 },
                ].map(t => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => { setHours(t.h); setMinutes(t.m); }}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      hours === t.h && minutes === t.m
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={confirmDateTime}
                disabled={!selectedDate}
                className="w-full py-2 bg-amber-500 text-black text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
