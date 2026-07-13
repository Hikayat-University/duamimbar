import { Project } from "@/lib/types";
import Badge from "./Badge";

export default function ProjectDetail({
  project,
  canEdit,
}: {
  project: Project;
  canEdit: boolean;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-denim-ink">{project.name}</h2>
      <div className="mt-2">
        <Badge status={project.status} />
      </div>
      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-[10.5px] uppercase tracking-wide text-muted">PIC</dt>
          <dd className="text-[13.5px] text-ink">{project.pic}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-wide text-muted">Estimasi</dt>
          <dd className="text-[13.5px] text-ink">{project.eta}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-wide text-muted">Deskripsi</dt>
          <dd className="text-[13.5px] leading-relaxed text-ink">{project.desc}</dd>
        </div>
      </dl>
      {canEdit && (
        <button className="mt-5 w-full rounded-xl bg-denim py-2.5 text-sm font-semibold text-white">
          Edit Proyek
        </button>
      )}
    </div>
  );
}
