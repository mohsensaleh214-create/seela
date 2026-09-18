import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { REASON_PRESETS, houseTone } from '@/lib/housePoints';
import { PersonAvatar } from '@/components/ui/PersonAvatar';
import { useToast } from '@/components/ui/Toast';

export function HousePointsAwardPanel({ studentId, onAwarded }: { studentId: string; onAwarded?: () => void }) {
  const { state, currentUser, dispatch, logAudit } = useApp();
  const { show } = useToast();

  const student = state.students.find((s) => s.id === studentId);
  if (!student) return null;

  const tone = houseTone(student.house);
  const name = studentName(student);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <PersonAvatar name={name} size={40} />
        <div>
          <p className="text-[16px] font-semibold text-ink">{name}</p>
          <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tone.base }} aria-hidden />
            {student.house} · Year {student.yearGroup} · {student.tutorGroup}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {REASON_PRESETS.map((preset) => (
          <button
            key={preset.reason}
            type="button"
            onClick={() => {
              dispatch({
                type: 'AWARD_HOUSE_POINTS',
                studentId: student.id,
                points: preset.points,
                reason: preset.reason,
                actorId: currentUser.id,
              });
              logAudit({
                actorId: currentUser.id,
                action: 'create',
                entityType: 'house-points',
                entityId: student.id,
                entityLabel: `${preset.points} house points for ${name}`,
                context: preset.reason,
              });
              show(`+${preset.points} points to ${name} for ${preset.reason}`);
              onAwarded?.();
            }}
            className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-[8px] border border-line-strong bg-surface px-2 py-2.5 text-center transition-colors duration-150 hover:bg-surface-sunken"
          >
            <span className="text-[15px] font-semibold text-ink">+{preset.points}</span>
            <span className="text-[13px] text-ink-body">{preset.reason}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
