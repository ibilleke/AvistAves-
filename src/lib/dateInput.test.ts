import { formatForInput, parseInputDate } from './dateInput';

describe('formatForInput', () => {
  it('pads day, month, hour and minute to two digits', () => {
    const date = new Date(2026, 0, 5, 9, 3); // 5 Jan 2026, 09:03
    expect(formatForInput(date)).toBe('2026-01-05 09:03');
  });

  it('does not pad the year', () => {
    const date = new Date(2026, 11, 31, 23, 59);
    expect(formatForInput(date)).toBe('2026-12-31 23:59');
  });
});

describe('parseInputDate', () => {
  it('parses a well-formed "AAAA-MM-DD HH:mm" string', () => {
    const date = parseInputDate('2026-01-05 09:03');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(0);
    expect(date?.getDate()).toBe(5);
    expect(date?.getHours()).toBe(9);
    expect(date?.getMinutes()).toBe(3);
  });

  it('accepts a "T" separator as well as a space', () => {
    const date = parseInputDate('2026-01-05T09:03');
    expect(date).not.toBeNull();
  });

  it('is the inverse of formatForInput', () => {
    const original = new Date(2026, 5, 15, 14, 30);
    const roundTripped = parseInputDate(formatForInput(original));
    expect(roundTripped?.getTime()).toBe(original.getTime());
  });

  it('returns null for garbage input', () => {
    expect(parseInputDate('not a date')).toBeNull();
    expect(parseInputDate('')).toBeNull();
    expect(parseInputDate('2026/01/05 09:03')).toBeNull();
  });

  it('returns null for an incomplete string', () => {
    expect(parseInputDate('2026-01-05')).toBeNull();
  });
});
