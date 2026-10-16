import { format, formatDistanceToNow } from "date-fns";
import { CalendarClock, MessageSquare } from "lucide-react";
import type { Discussion } from "@/lib/types";
export function DiscussionTimeline({
  discussions,
}: {
  discussions: Discussion[];
}) {
  return (
    <>
      {" "}
      <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold">
        <MessageSquare size={16} />
        Discussion history{" "}
        <span className="text-muted-foreground">({discussions.length})</span>
      </h3>
      <div className="mb-6 max-h-72 overflow-y-auto pr-2">
        {!discussions.length ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Every relationship starts with a conversation. Add your first note
            below.
          </div>
        ) : (
          <ol className="ml-2 border-l border-border">
            {discussions.map((note) => (
              <li key={note.id} className="relative pb-6 pl-6 last:pb-1">
                <span className="absolute -left-[5px] top-1 size-2.5 rounded-full border-2 border-card bg-primary" />
                <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                  <time dateTime={note.createdAt}>
                    {format(new Date(note.createdAt), "MMM d, yyyy · h:mm a")}
                  </time>
                  <span>
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {note.content}
                </p>
                {note.followUpAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock size={12} />
                    Scheduled for{" "}
                    {format(new Date(note.followUpAt), "MMM d, yyyy · h:mm a")}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
