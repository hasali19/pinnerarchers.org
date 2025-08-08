import { format, formatISO, isAfter } from "date-fns";
import ICAL from "ical.js";
import { useEffect, useMemo, useState } from "react";

export interface Props {
  icalSrc: string;
}

export default function Calendar({ icalSrc }: Props) {
  const [events, setEvents] = useState<ICAL.Event[]>([]);

  useEffect(() => {
    (async () => {
      const data = await (async () => {
        const res = await fetch(icalSrc);
        return await res.text();
      })();

      const now = Date.now();

      const jcal = ICAL.parse(data);
      const comp = new ICAL.Component(jcal);
      const events = comp
        .getAllSubcomponents("vevent")
        .map((c) => new ICAL.Event(c))
        .filter((e) => isAfter(e.startDate.toJSDate(), now));

      setEvents(events);
    })();
  }, []);

  const eventsByDate = useMemo(() => {
    const eventsByDate: Map<string, ICAL.Event[]> = new Map();

    for (const event of events) {
      const startDate = event.startDate.toJSDate();

      const date = formatISO(startDate, { representation: "date" });

      if (!eventsByDate.has(date)) {
        eventsByDate.set(date, []);
      }

      eventsByDate.get(date)!.push(event);
    }

    return [...eventsByDate.entries()].sort();
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {Array.from(
        eventsByDate.map(([date, events]) => (
          <div key={date}>
            <div className="p-4 text-sm uppercase text-gray-700 bg-green-50">
              {new Date(date).toDateString()}
            </div>
            <div className="px-2">
              {events.map((event) => (
                <div key={event.uid} className="flex my-4 gap-2">
                  <div className="w-[3px] mx-2 bg-green-700 rounded-sm"></div>
                  <div className="flex-1 flex gap-2 justify-between">
                    <div className="flex flex-col justify-center">
                      <div className="text-lg">{event.summary}</div>
                      <div className="text-sm text-gray-600">
                        {event.location}
                      </div>
                    </div>
                    <div className="text-sm text-end shrink-0">
                      <p>{format(event.startDate.toJSDate(), "h:mm a")}</p>
                      <p className="text-sm text-gray-500">
                        {format(event.endDate.toJSDate(), "h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
