export type MarketOperatingStatus = 'OPEN' | 'CLOSED' | 'RESTRICTED';

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export interface MarketRestriction {
  date: string;
  status: Exclude<MarketOperatingStatus, 'OPEN'>;
  reason: string;
}

export interface MarketHoursSchedule {
  timezone: string;
  openTime: TimeOfDay;
  closeTime: TimeOfDay;
  operatingDays: number[];
}

export interface MarketHoursSnapshot {
  marketCode: string;
  timezone: string;
  openTime: TimeOfDay;
  closeTime: TimeOfDay;
  operatingDays: number[];
  restrictions: MarketRestriction[];
}

export interface MarketHoursEvaluation {
  marketCode: string;
  status: MarketOperatingStatus;
  canProcessOrder: boolean;
  evaluatedAt: Date;
  timezone: string;
  reason: string;
}

interface ZonedDateParts {
  date: string;
  dayOfWeek: number;
  minutesFromMidnight: number;
}

export class MarketHours {
  private constructor(private readonly snapshot: MarketHoursSnapshot) {}

  static restore(snapshot: MarketHoursSnapshot): MarketHours {
    if (
      typeof snapshot.marketCode !== 'string' ||
      !snapshot.marketCode.trim()
    ) {
      throw new Error('Market code is required');
    }

    if (typeof snapshot.timezone !== 'string' || !snapshot.timezone.trim()) {
      throw new Error('Market timezone is required');
    }

    if (
      !Array.isArray(snapshot.operatingDays) ||
      snapshot.operatingDays.length === 0
    ) {
      throw new Error('Market must define at least one operating day');
    }

    for (const day of snapshot.operatingDays) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error('Operating days must be integers between 0 and 6');
      }
    }

    const openMinutes = this.toMinutes(snapshot.openTime);
    const closeMinutes = this.toMinutes(snapshot.closeTime);

    if (openMinutes >= closeMinutes) {
      throw new Error('Market open time must be before close time');
    }

    return new MarketHours({
      ...snapshot,
      marketCode: snapshot.marketCode.trim().toUpperCase(),
      timezone: snapshot.timezone.trim(),
      operatingDays: [...new Set(snapshot.operatingDays)].sort(
        (left, right) => left - right,
      ),
      restrictions: [...snapshot.restrictions],
    });
  }

  static configure(
    marketCode: string,
    schedule: MarketHoursSchedule,
    restrictions: MarketRestriction[] = [],
  ): MarketHours {
    return MarketHours.restore({
      marketCode,
      ...schedule,
      restrictions,
    });
  }

  evaluate(at: Date): MarketHoursEvaluation {
    if (Number.isNaN(at.getTime())) {
      throw new Error('Evaluation date must be valid');
    }

    const zonedParts = this.getZonedParts(at, this.snapshot.timezone);
    const restriction = this.snapshot.restrictions.find(
      (item) => item.date === zonedParts.date,
    );

    if (restriction) {
      return this.buildEvaluation(restriction.status, at, restriction.reason);
    }

    if (!this.snapshot.operatingDays.includes(zonedParts.dayOfWeek)) {
      return this.buildEvaluation('CLOSED', at, 'Market is closed today');
    }

    const openMinutes = MarketHours.toMinutes(this.snapshot.openTime);
    const closeMinutes = MarketHours.toMinutes(this.snapshot.closeTime);
    const isOpen =
      zonedParts.minutesFromMidnight >= openMinutes &&
      zonedParts.minutesFromMidnight < closeMinutes;

    if (!isOpen) {
      return this.buildEvaluation(
        'CLOSED',
        at,
        'Market is outside trading hours',
      );
    }

    return this.buildEvaluation('OPEN', at, 'Market is open for trading');
  }

  toSnapshot(): MarketHoursSnapshot {
    return {
      ...this.snapshot,
      openTime: { ...this.snapshot.openTime },
      closeTime: { ...this.snapshot.closeTime },
      operatingDays: [...this.snapshot.operatingDays],
      restrictions: [...this.snapshot.restrictions],
    };
  }

  configureSchedule(schedule: MarketHoursSchedule): MarketHours {
    return MarketHours.restore({
      ...this.snapshot,
      ...schedule,
      restrictions: this.snapshot.restrictions,
    });
  }

  upsertRestriction(restriction: MarketRestriction): MarketHours {
    const restrictions = this.snapshot.restrictions.filter(
      (item) => item.date !== restriction.date,
    );

    restrictions.push(restriction);

    return MarketHours.restore({
      ...this.snapshot,
      restrictions,
    });
  }

  private buildEvaluation(
    status: MarketOperatingStatus,
    evaluatedAt: Date,
    reason: string,
  ): MarketHoursEvaluation {
    return {
      marketCode: this.snapshot.marketCode,
      status,
      canProcessOrder: status === 'OPEN',
      evaluatedAt,
      timezone: this.snapshot.timezone,
      reason,
    };
  }

  private static toMinutes(time: TimeOfDay): number {
    if (
      !Number.isInteger(time.hour) ||
      !Number.isInteger(time.minute) ||
      time.hour < 0 ||
      time.hour > 23 ||
      time.minute < 0 ||
      time.minute > 59
    ) {
      throw new Error('Invalid time of day');
    }

    return time.hour * 60 + time.minute;
  }

  private getZonedParts(at: Date, timezone: string): ZonedDateParts {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      weekday: 'short',
    });

    const parts = Object.fromEntries(
      formatter.formatToParts(at).map((part) => [part.type, part.value]),
    );
    const year = MarketHours.getRequiredDatePart(parts, 'year');
    const month = MarketHours.getRequiredDatePart(parts, 'month');
    const day = MarketHours.getRequiredDatePart(parts, 'day');
    const hour = MarketHours.getRequiredNumericPart(parts, 'hour');
    const minute = MarketHours.getRequiredNumericPart(parts, 'minute');
    const weekday = MarketHours.getRequiredDatePart(parts, 'weekday');

    return {
      date: `${year}-${month}-${day}`,
      dayOfWeek: MarketHours.weekdayToNumber(weekday),
      minutesFromMidnight: hour * 60 + minute,
    };
  }

  private static getRequiredDatePart(
    parts: Record<string, string>,
    partName: string,
  ): string {
    const value = parts[partName];

    if (!value) {
      throw new Error(`Unable to resolve market date part ${partName}`);
    }

    return value;
  }

  private static getRequiredNumericPart(
    parts: Record<string, string>,
    partName: string,
  ): number {
    const value = this.getRequiredDatePart(parts, partName);
    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue)) {
      throw new Error(`Unable to resolve numeric market date part ${partName}`);
    }

    return parsedValue;
  }

  private static weekdayToNumber(weekday: string): number {
    const weekdays: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    if (!weekday || weekdays[weekday] === undefined) {
      throw new Error('Unable to resolve market weekday');
    }

    return weekdays[weekday];
  }
}
