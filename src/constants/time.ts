export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
export const WEEK = 7 * DAY;
export const MONTH = 30 * DAY;

export const timeToString = (ms: number): string => {
  const timeUnits = [
    { label: 'month', value: MONTH },
    { label: 'week', value: WEEK },
    { label: 'day', value: DAY },
    { label: 'hour', value: HOUR },
    { label: 'minute', value: MINUTE },
    { label: 'second', value: SECOND },
  ];

  const formatTime = (remaining: number, units: typeof timeUnits): string => {
    if (remaining === 0 || units.length === 0) {
      return '';
    }

    const [currentUnit, ...restUnits] = units;
    const count = Math.floor(remaining / currentUnit.value);
    const remainder = remaining % currentUnit.value;

    if (count === 0) {
      return formatTime(remainder, restUnits);
    }

    const currentString = `${count} ${currentUnit.label}${count === 1 ? '' : 's'}`;
    const restString = formatTime(remainder, restUnits);

    return restString ? `${currentString}, ${restString}` : currentString;
  };

  const result = formatTime(ms, timeUnits);
  return result || '0 seconds';
};
