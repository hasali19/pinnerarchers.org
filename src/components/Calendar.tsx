import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  formatISO,
  isAfter,
  isPast,
  isToday,
  set,
  subDays,
} from "date-fns";
import ICAL from "ical.js";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthConfig(month: number, year: number, offset: number) {
  const monthStart = addMonths(new Date(year, month, 1), offset);
  const monthEnd = endOfMonth(monthStart);
  return {
    start: subDays(monthStart, monthStart.getDay() - 1),
    weeks: Math.ceil((monthStart.getDay() - 1 + monthEnd.getDate()) / 7),
    month: monthStart,
  };
}

export interface Props {
  icalSrc: string;
}

export default function Calendar({ icalSrc }: Props) {
  const isSmallScreen = useMediaQuery("(width <= 48rem)");
  const [events, setEvents] = useState<ICAL.Event[]>([]);
  const [offset, setOffset] = useState(0);

  const today = useMemo(() => new Date(), []);
  const { start, weeks, month } = getMonthConfig(
    today.getMonth(),
    today.getFullYear(),
    offset
  );

  useEffect(() => {
    (async () => {
      const data = await (async () => {
        const res = await fetch(icalSrc);
        return await res.text();
      })();

      const jcal = ICAL.parse(data);
      const comp = new ICAL.Component(jcal);
      const events = comp
        .getAllSubcomponents("vevent")
        .map((c) => new ICAL.Event(c))
        .filter((e) => isAfter(e.startDate.toJSDate(), month));

      setEvents(events);
    })();
  }, []);

  const groupedEvents = useMemo(() => {
    const eventsByDate: Map<string, ICAL.Event[]> = new Map();

    for (const event of events) {
      const startDate = event.startDate.toJSDate();

      if (startDate.getMonth() !== month.getMonth()) {
        continue;
      }

      const date = formatISO(startDate, { representation: "date" });

      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, []);
      }

      eventsByDate.get(date)!.push(event);
    }

    return [...eventsByDate.entries()].sort();
  }, [events, month.getMonth()]);

  if (events.length === 0) {
    return null;
  }

  if (isSmallScreen) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="flex justify-between p-6">
          <div className="text-2xl">
            <span className="font-bold">{format(month, "MMMM")}</span>{" "}
            {month.getFullYear()}
          </div>
          <div className="inline-flex rounded-lg shadow-2xs">
            <ButtonGroupButton onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft />
            </ButtonGroupButton>
            <ButtonGroupButton onClick={() => setOffset(0)}>
              Today
            </ButtonGroupButton>
            <ButtonGroupButton onClick={() => setOffset((o) => o + 1)}>
              <ChevronRight />
            </ButtonGroupButton>
          </div>
        </div>
        {Array.from(
          groupedEvents
            .filter(([date]) =>
              isAfter(new Date(date), set(today, { hours: 0, minutes: 0 }))
            )
            .map(([date, events]) => (
              <div key={date}>
                <div className="p-4 text-sm uppercase text-gray-700 bg-green-50">
                  {new Date(date).toDateString()}
                </div>
                <div className="px-2">
                  {events.map((event) => {
                    return (
                      <div key={event.uid} className="flex my-4 gap-2">
                        <div className="w-[3px] mx-2 bg-green-700 rounded-sm"></div>
                        <div className="flex-1 flex gap-2 justify-between">
                          <div className="flex flex-col justify-center">
                            <div className="text-lg">{event.summary}</div>
                            <div className="text-sm text-gray-600">
                              <a
                                href={createMapUrl(event.location).toString()}
                                className="text-green-800 hover:text-green-700 hover:underline active:text-green-700 active:underline"
                              >
                                {event.location}
                              </a>
                            </div>
                          </div>
                          <div className="text-sm text-end shrink-0">
                            <p>
                              {format(event.startDate.toJSDate(), "h:mm a")}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(event.endDate.toJSDate(), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </div>
    );
  }

  return (
    <div className="grid border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex justify-between p-6">
        <div className="text-2xl">
          <span className="font-bold">{format(month, "MMMM")}</span>{" "}
          {month.getFullYear()}
        </div>
        <div className="inline-flex rounded-lg shadow-2xs">
          <ButtonGroupButton onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft />
          </ButtonGroupButton>
          <ButtonGroupButton onClick={() => setOffset(0)}>
            Today
          </ButtonGroupButton>
          <ButtonGroupButton onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight />
          </ButtonGroupButton>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((day) => (
          <div key={day} className="text-xs text-gray-800 text-end p-2">
            {day}
          </div>
        ))}
      </div>
      {[...Array(weeks).keys()].map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-7 h-[125px] not-last:border-b border-gray-100"
        >
          {DAYS.map((_, j) => {
            const date = addDays(start, i * 7 + j);
            const bg = isToday(date) ? "bg-green-50" : "";
            const eventsKey = formatISO(date, { representation: "date" });
            const [_k, events] = groupedEvents.find(
              ([k]) => k === eventsKey
            ) ?? ["", []];
            return (
              <div
                key={j}
                className={`not-last:border-e border-gray-100 ${bg}`}
              >
                {date.getMonth() === month.getMonth() ? (
                  <div className="p-2 text-xs text-end">{date.getDate()}</div>
                ) : (
                  <div className="p-2 text-xs text-end text-gray-400">
                    {date.getDate()}
                  </div>
                )}
                {events.map((e) => (
                  <MonthViewEvent key={e.uid} e={e} />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MonthViewEvent({ e }: { e: ICAL.Event }) {
  const startDate = e.startDate.toJSDate();
  const endDate = e.endDate.toJSDate();

  const isEnded = isPast(endDate);
  const bg = isPast(endDate) ? "bg-green-50" : "bg-green-100";
  const accent = isEnded ? "bg-green-500" : "bg-green-700";

  const textPrimary = isEnded ? "text-gray-500" : "";
  const textSecondary = isEnded ? "text-gray-400" : "text-gray-800";

  let shortLocation;
  if (e.location.includes("Metropolitan Bushey")) {
    shortLocation = "Met";
  } else if (e.location.includes("Tithe Farm")) {
    shortLocation = "TFSC";
  } else {
    shortLocation = "Away";
  }

  return (
    <>
      <button
        className="w-full p-1 text-start"
        popoverTarget={"event-details-" + e.uid}
      >
        <div
          className={`flex ${bg} ${textPrimary} rounded-sm overflow-hidden cursor-pointer select-none`}
        >
          <div className={`w-[3px] shrink-0 ${accent} rounded-sm`}></div>
          <div className="flex-1 p-1">
            <div className="text-sm font-bold whitespace-nowrap">
              {e.summary}
            </div>
            <div className={`text-xs ${textSecondary} whitespace-nowrap`}>
              {format(startDate, "h:mm a")} • {shortLocation}
            </div>
          </div>
        </div>
      </button>
      <div
        id={"event-details-" + e.uid}
        popover="auto"
        style={{
          top: "auto",
          bottom: "anchor(top)",
          justifySelf: "anchor-center",
        }}
      >
        <div className="w-xs bg-white border border-gray-200 text-start rounded-lg overflow-hidden">
          <span className="pt-3 px-4 block text-lg font-bold text-gray-800">
            {e.summary}
          </span>
          <div className="pt-1 pb-3 px-4 text-sm">
            <p className="text-xs">{format(startDate, "h:mm a")}</p>
            {e.description && <p className="mt-3">{e.description}</p>}
            {e.location && (
              <dl className="mt-3">
                <dt className="font-bold pt-3 first:pt-0">Location:</dt>
                <dd className="text-gray-600">
                  <a
                    href={createMapUrl(e.location).toString()}
                    className="text-green-700 hover:text-green-600 hover:underline active:text-green-600 active:underline"
                  >
                    {e.location} <ExternalLink className="inline" size={12} />
                  </a>
                </dd>
              </dl>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function useMediaQuery(query: string) {
  const mediaQuery = window.matchMedia(query);
  const [matches, setMatches] = useState(mediaQuery.matches);

  useEffect(() => {
    function onChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mediaQuery.addEventListener("change", onChange);

    return () => {
      mediaQuery.removeEventListener("change", onChange);
    };
  }, []);

  return matches;
}

interface ButtonGroupButtonProps extends React.PropsWithChildren {
  onClick?: () => void;
}

function ButtonGroupButton(props: ButtonGroupButtonProps) {
  return (
    <button
      type="button"
      className="py-1 px-2 inline-flex justify-center items-center gap-2 -ms-px first:rounded-s-lg first:ms-0 last:rounded-e-lg text-xs font-medium focus:z-10 border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function createMapUrl(location: string) {
  const mapUrl = new URL("https://www.google.com/maps/search/?api=1");
  mapUrl.searchParams.append("query", location);
  return mapUrl;
}
