import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { studentName } from '@/lib/selectors';
import { canReadCase } from '@/lib/selectors';
import { buildStudentTimeline } from '@/lib/timeline';
import { PersonAvatar } from '@/components/ui/PersonAvatar';
import { SeverityDot } from '@/components/ui/Badge';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { OverviewTab } from './student-profile/OverviewTab';
import { TimelineTab } from './student-profile/TimelineTab';
import { MedicalTab } from './student-profile/MedicalTab';
import { WellbeingTab } from './student-profile/WellbeingTab';
import { SafeguardingTab } from './student-profile/SafeguardingTab';

export function StudentProfile() {
  const { studentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, currentUser, permissions, logAudit, dispatch } = useApp();

  const student = state.students.find((s) => s.id === studentId);

  useEffect(() => {
    if (student) {
      logAudit({
        actorId: currentUser.id,
        action: 'view',
        entityType: 'student',
        entityId: student.id,
        entityLabel: `${studentName(student)}'s profile`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id, currentUser.id]);

  const visibleFlags = useMemo(
    () => (student ? state.flags.filter((f) => student.flagIds.includes(f.id) && f.visibleToRoles.includes(currentUser.role)) : []),
    [student, state.flags, currentUser.role],
  );

  const studentCases = useMemo(() => (student ? state.cases.filter((c) => c.studentId === student.id) : []), [student, state.cases]);

  const readableCases = useMemo(
    () =>
      studentCases.filter((c) => {
        const actionOwnerIds = state.actions.filter((a) => a.caseId === c.id).map((a) => a.ownerId);
        return canReadCase(permissions, c, student!, currentUser, actionOwnerIds);
      }),
    [studentCases, permissions, currentUser, state.actions, student],
  );

  const safeguardingLocked = permissions.safeguarding === 'none' || (studentCases.length > 0 && readableCases.length === 0);

  const medicalRecords = useMemo(() => (student ? state.medicalRecords.filter((m) => m.studentId === student.id) : []), [student, state.medicalRecords]);
  const wellbeingRecords = useMemo(() => (student ? state.wellbeingRecords.filter((w) => w.studentId === student.id) : []), [student, state.wellbeingRecords]);

  const timelineItems = useMemo(
    () => (student ? buildStudentTimeline(state, student, currentUser, permissions) : []),
    [student, state, currentUser, permissions],
  );

  if (!student) {
    return <EmptyState title="Student not found" body="This student record does not exist in the dummy dataset." />;
  }

  const tabs: TabItem[] = [{ key: 'overview', label: 'Overview' }, { key: 'timeline', label: 'Timeline' }];
  if (permissions.medical !== 'none') tabs.push({ key: 'medical', label: 'Medical' });
  if (permissions.wellbeing !== 'none') tabs.push({ key: 'wellbeing', label: 'Wellbeing' });
  tabs.push({ key: 'safeguarding', label: 'Safeguarding', locked: safeguardingLocked });
  tabs.push({ key: 'documents', label: 'Documents' });

  const activeTab = tabs.some((t) => t.key === searchParams.get('tab')) ? (searchParams.get('tab') as string) : 'overview';

  const setTab = (key: string) => setSearchParams(key === 'overview' ? {} : { tab: key });

  return (
    <>
      <div className="flex flex-col gap-4 rounded-[12px] border border-line bg-surface p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <PersonAvatar name={studentName(student)} size={56} />
          <div>
            <h1 className="text-[28px] font-semibold leading-[1.2] text-ink">{studentName(student)}</h1>
            <p className="mt-1 text-[15px] text-ink-muted">
              Year {student.yearGroup} · {student.tutorGroup} · {student.campus}
            </p>
            {visibleFlags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleFlags.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface-sunken px-2.5 py-1 text-[13px] font-medium text-ink-body"
                  >
                    <SeverityDot severity={f.severity} />
                    {f.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Link
          to={`/raise-concern?student=${student.id}`}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[8px] bg-ink px-4 py-2.5 text-[15px] font-medium text-white hover:bg-black"
        >
          Raise a concern
        </Link>
      </div>

      <Tabs items={tabs} active={activeTab} onChange={setTab} />

      <div>
        {activeTab === 'overview' && <OverviewTab student={student} flags={visibleFlags} />}
        {activeTab === 'timeline' && (
          <TimelineTab
            items={timelineItems}
            student={student}
            onAcknowledgeFlag={(id) => {
              dispatch({ type: 'ACK_PATTERN_FLAG', id });
              logAudit({
                actorId: currentUser.id,
                action: 'edit',
                entityType: 'student',
                entityId: student.id,
                entityLabel: `a system flag on ${studentName(student)}'s timeline`,
                context: 'Acknowledged',
              });
            }}
            onDismissFlag={(id, reason) => {
              dispatch({ type: 'DISMISS_PATTERN_FLAG', id, reason });
              logAudit({
                actorId: currentUser.id,
                action: 'edit',
                entityType: 'student',
                entityId: student.id,
                entityLabel: `a system flag on ${studentName(student)}'s timeline`,
                context: `Dismissed: ${reason}`,
              });
            }}
          />
        )}
        {activeTab === 'medical' && permissions.medical !== 'none' && (
          <MedicalTab student={student} records={medicalRecords} access={permissions.medical} />
        )}
        {activeTab === 'wellbeing' && permissions.wellbeing !== 'none' && <WellbeingTab student={student} records={wellbeingRecords} />}
        {activeTab === 'safeguarding' &&
          (safeguardingLocked ? (
            <Banner tone="locked">
              <p className="flex items-center gap-1.5 font-medium">
                <Lock size={15} aria-hidden />
                Restricted. Contact the safeguarding lead.
              </p>
              <p className="mt-1">Reading is limited by role. This boundary and every view of it are logged.</p>
            </Banner>
          ) : (
            <SafeguardingTab student={student} cases={readableCases} />
          ))}
        {activeTab === 'documents' && (
          <EmptyState title="No documents" body="Document upload is out of scope for this prototype." />
        )}
      </div>
    </>
  );
}
