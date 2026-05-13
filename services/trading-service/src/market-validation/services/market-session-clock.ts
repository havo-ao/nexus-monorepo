import type {
  MarketSchedule,
  MarketValidationResult,
} from '../repositories/market-status.repository';

type ZonedTime = {
  weekday: string;
  secondsFromStartOfDay: number;
};

const WEEKEND_DAYS = new Set(['Sat', 'Sun']);

export function evaluateMarketSession(
  schedule: MarketSchedule | null,
  exchangeId: string,
  evaluatedAt: Date,
): MarketValidationResult {
  if (!schedule) {
    return {
      canOperate: false,
      exchangeId,
      marketStatus: 'RESTRICTED',
      evaluatedAt,
      reason: 'Market exchange is not available for trading',
    };
  }

  const zonedTime = getZonedTime(evaluatedAt, schedule.timezone);
  const openSecond = parseTime(schedule.openTime);
  const closeSecond = parseTime(schedule.closeTime);

  if (WEEKEND_DAYS.has(zonedTime.weekday)) {
    return toClosedMarket(schedule, evaluatedAt, 'Market is closed today');
  }

  if (
    !isWithinTradingWindow(
      zonedTime.secondsFromStartOfDay,
      openSecond,
      closeSecond,
    )
  ) {
    return toClosedMarket(
      schedule,
      evaluatedAt,
      'Market is closed at this time',
    );
  }

  return {
    canOperate: true,
    exchangeId: schedule.exchangeId,
    marketStatus: 'OPEN',
    evaluatedAt,
    timezone: schedule.timezone,
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
  };
}

function toClosedMarket(
  schedule: MarketSchedule,
  evaluatedAt: Date,
  reason: string,
): MarketValidationResult {
  return {
    canOperate: false,
    exchangeId: schedule.exchangeId,
    marketStatus: 'CLOSED',
    evaluatedAt,
    timezone: schedule.timezone,
    openTime: schedule.openTime,
    closeTime: schedule.closeTime,
    reason,
  };
}

function getZonedTime(date: Date, timezone: string): ZonedTime {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);

  const partValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '0';

  const hour = Number(partValue('hour'));
  const minute = Number(partValue('minute'));
  const second = Number(partValue('second'));

  return {
    weekday: partValue('weekday'),
    secondsFromStartOfDay: hour * 3600 + minute * 60 + second,
  };
}

function parseTime(value: string): number {
  const [hours = '0', minutes = '0', seconds = '0'] = value.split(':');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function isWithinTradingWindow(
  currentSecond: number,
  openSecond: number,
  closeSecond: number,
): boolean {
  if (openSecond <= closeSecond) {
    return currentSecond >= openSecond && currentSecond < closeSecond;
  }

  return currentSecond >= openSecond || currentSecond < closeSecond;
}
