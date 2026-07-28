import type { ProgressNote } from "@/domain/progress-notes";

type Props = {
  notes: ProgressNote[];
  learnerName: string | null;
};

export function ProgressNoteHistory({ notes, learnerName }: Props) {
  if (notes.length === 0) {
    return (
      <div className="surface-card px-5 py-14 text-center">
        <p className="eyebrow text-[var(--color-accent)]">Progress</p>
        <p className="display-title mt-2 text-2xl text-[var(--color-primary)]">
          No notes yet
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-on-surface-muted)]">
          After a paid lesson is marked completed, your tutor can submit what was
          covered, what to improve, and homework
          {learnerName ? ` for ${learnerName}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {notes.map((note) => (
        <li key={note.id} className="surface-card overflow-hidden">
          <div className="border-b border-[var(--color-outline)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_6%,white),color-mix(in_srgb,var(--color-accent)_8%,white))] px-5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Lesson note
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--color-on-surface)]">
              {new Date(note.created_at).toLocaleString()}
              {note.admin_corrected_at ? " · Updated by admin" : ""}
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <NoteBlock label="Covered" body={note.covered} />
            <NoteBlock label="Improve" body={note.improve} />
            <NoteBlock label="Homework" body={note.homework} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function NoteBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="eyebrow text-[var(--color-accent)]">{label}</p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-on-surface)]">
        {body}
      </p>
    </div>
  );
}
