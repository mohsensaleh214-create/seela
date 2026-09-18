import { fromAnchor } from './clock';
import type {
  Student,
  Staff,
  Case,
  Entry,
  Action,
  ContactRecord,
  MedicalRecord,
  WellbeingRecord,
  Flag,
  AuditEvent,
  Activity,
  PatternFlagState,
} from './types';

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

const SYSTEM_AT = fromAnchor(-120);

function meta(createdBy: string, createdAt = SYSTEM_AT) {
  return { createdAt, createdBy, updatedAt: createdAt, updatedBy: createdBy };
}

// ---------------------------------------------------------------------------
// Staff — the five personas for the role switcher
// ---------------------------------------------------------------------------

export const STAFF: Staff[] = [
  {
    id: 'staff-emily-carter',
    firstName: 'Emily',
    lastName: 'Carter',
    jobTitle: 'Senior Designated Safeguarding Lead',
    role: 'senior-dsl',
    campus: 'Both campuses',
    email: 'emily.carter@miskschools.edu',
    certifications: [{ name: 'Advanced safeguarding (Level 3)', expiry: '2027-06-01' }],
    ...meta('system'),
  },
  {
    id: 'staff-dan-whitfield',
    firstName: 'Dan',
    lastName: 'Whitfield',
    jobTitle: 'Designated Safeguarding Lead, Boys School',
    role: 'dsl',
    campus: 'Boys School',
    email: 'dan.whitfield@miskschools.edu',
    certifications: [{ name: 'Designated safeguarding lead training', expiry: '2027-01-15' }],
    ...meta('system'),
  },
  {
    id: 'staff-priya-nair',
    firstName: 'Priya',
    lastName: 'Nair',
    jobTitle: 'School Nurse',
    role: 'nurse',
    campus: 'Both campuses',
    email: 'priya.nair@miskschools.edu',
    certifications: [
      { name: 'Paediatric first aid', expiry: '2027-03-20' },
      { name: 'Anaphylaxis and epinephrine administration', expiry: '2027-03-20' },
    ],
    ...meta('system'),
  },
  {
    id: 'staff-tom-reilly',
    firstName: 'Tom',
    lastName: 'Reilly',
    jobTitle: 'Head of Year 9 and pastoral lead',
    role: 'pastoral-lead',
    campus: 'Girls School',
    email: 'tom.reilly@miskschools.edu',
    certifications: [{ name: 'Safeguarding awareness (Level 1)', expiry: '2027-02-01' }],
    ...meta('system'),
  },
  {
    id: 'staff-sarah-ahmed',
    firstName: 'Sarah',
    lastName: 'Ahmed',
    jobTitle: 'Class teacher',
    role: 'teacher',
    campus: 'Girls School',
    email: 'sarah.ahmed@miskschools.edu',
    certifications: [{ name: 'Safeguarding awareness (Level 1)', expiry: '2026-11-01' }],
    ...meta('system'),
  },
];

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

function flatAttendance(base: number): number[] {
  return Array.from({ length: 8 }, (_, i) => Math.max(70, Math.min(100, base + (((i * 37) % 7) - 3))));
}

function decliningAttendance(from: number, to: number): number[] {
  const steps = 8;
  return Array.from({ length: steps }, (_, i) => Math.round(from + ((to - from) * i) / (steps - 1)));
}

interface SeedStudent {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  yearGroup: number;
  tutorGroup: string;
  campus: 'Girls School' | 'Boys School';
  dob: string;
  guardians: Student['guardians'];
  attendance: number[];
}

const NAMED: SeedStudent[] = [
  {
    id: 'stu-layla-alotaibi',
    firstName: 'Layla',
    lastName: 'Al-Otaibi',
    yearGroup: 9,
    tutorGroup: '9G',
    campus: 'Girls School',
    dob: '2017-03-11',
    guardians: [{ name: 'Noura Al-Otaibi', relationship: 'Mother', phone: '+966 50 111 2233', isPrimary: true }],
    attendance: flatAttendance(97),
  },
  {
    id: 'stu-omar-haddad',
    firstName: 'Omar',
    lastName: 'Haddad',
    yearGroup: 7,
    tutorGroup: '7B',
    campus: 'Boys School',
    dob: '2019-05-22',
    guardians: [{ name: 'Yousef Haddad', relationship: 'Father', phone: '+966 50 222 3344', isPrimary: true }],
    attendance: decliningAttendance(96, 81),
  },
  {
    id: 'stu-sophie-brennan',
    firstName: 'Sophie',
    lastName: 'Brennan',
    yearGroup: 11,
    tutorGroup: '11S',
    campus: 'Girls School',
    dob: '2015-01-30',
    guardians: [{ name: 'Claire Brennan', relationship: 'Mother', phone: '+966 50 333 4455', isPrimary: true }],
    attendance: decliningAttendance(94, 85),
  },
  {
    id: 'stu-yusuf-rahman',
    firstName: 'Yusuf',
    lastName: 'Rahman',
    yearGroup: 5,
    tutorGroup: '5R',
    campus: 'Boys School',
    dob: '2021-09-02',
    guardians: [{ name: 'Amina Rahman', relationship: 'Mother', phone: '+966 50 444 5566', isPrimary: true }],
    attendance: flatAttendance(98),
  },
  {
    id: 'stu-hana-nakamura',
    firstName: 'Hana',
    lastName: 'Nakamura',
    yearGroup: 10,
    tutorGroup: '10N',
    campus: 'Girls School',
    dob: '2016-07-19',
    guardians: [{ name: 'Kenji Nakamura', relationship: 'Father', phone: '+966 50 555 6677', isPrimary: true }],
    attendance: flatAttendance(93),
  },
  {
    id: 'stu-daniel-okoro',
    firstName: 'Daniel',
    lastName: 'Okoro',
    yearGroup: 8,
    tutorGroup: '8K',
    campus: 'Boys School',
    dob: '2018-11-04',
    guardians: [{ name: 'Grace Okoro', relationship: 'Mother', phone: '+966 50 666 7788', isPrimary: true }],
    attendance: flatAttendance(91),
  },
  {
    id: 'stu-grace-thompson',
    firstName: 'Grace',
    lastName: 'Thompson',
    yearGroup: 11,
    tutorGroup: '11S',
    campus: 'Girls School',
    dob: '2015-04-14',
    guardians: [{ name: 'Michael Thompson', relationship: 'Father', phone: '+966 50 777 8899', isPrimary: true }],
    attendance: flatAttendance(95),
  },
  {
    id: 'stu-fatima-zahra',
    firstName: 'Fatima',
    lastName: 'Zahra',
    yearGroup: 9,
    tutorGroup: '9G',
    campus: 'Girls School',
    dob: '2017-02-08',
    guardians: [{ name: 'Hassan Zahra', relationship: 'Father', phone: '+966 50 888 9900', isPrimary: true }],
    attendance: flatAttendance(92),
  },
  {
    id: 'stu-ibrahim-saleh',
    firstName: 'Ibrahim',
    lastName: 'Saleh',
    yearGroup: 6,
    tutorGroup: '6H',
    campus: 'Boys School',
    dob: '2020-06-27',
    guardians: [{ name: 'Layla Saleh', relationship: 'Mother', phone: '+966 50 999 0011', isPrimary: true }],
    attendance: flatAttendance(94),
  },
];

const FIRST_NAMES = [
  'Aisha', 'Mariam', 'Noor', 'Reem', 'Dana', 'Lina', 'Sara', 'Huda', 'Rania', 'Yara',
  'Khalid', 'Faisal', 'Zaid', 'Tariq', 'Nasser', 'Hamza', 'Adam', 'Ali', 'Saeed', 'Rashid',
  'Emma', 'Chloe', 'Isla', 'Freya', 'Jack', 'Oliver', 'Noah', 'Leo', 'Ryan', 'Mason',
  'Priya', 'Ananya', 'Wei', 'Mei', 'Sofia',
];
const LAST_NAMES = [
  'Al-Fahad', 'Al-Rashid', 'Al-Sabah', 'Mansour', 'Qureshi', 'Farooq', 'Malik', 'Chen',
  'Osei', 'Boateng', 'Murphy', 'Walsh', 'Kelly', 'Novak', 'Ivanov', 'Petrov', 'Costa',
  'Silva', 'Rossi', 'Bernard', 'Dubois', 'Kaur', 'Singh', 'Sharma', 'Yousef', 'Hassan',
  'Barakat', 'Nasser', 'Idris', 'Karim', 'Hadi', 'Aziz', 'Noor', 'Farah', 'Lami',
];

function fillerStudents(count: number): SeedStudent[] {
  const out: SeedStudent[] = [];
  for (let i = 0; i < count; i += 1) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3 + 1) % LAST_NAMES.length];
    const yearGroup = 3 + (i % 10);
    const campus: 'Girls School' | 'Boys School' = i % 2 === 0 ? 'Girls School' : 'Boys School';
    const letter = 'ABCDE'[i % 5];
    out.push({
      id: `stu-filler-${i}`,
      firstName: first,
      lastName: last,
      yearGroup,
      tutorGroup: `${yearGroup}${letter}`,
      campus,
      dob: `${2026 - yearGroup - 5}-0${(i % 9) + 1}-1${i % 9}`,
      guardians: [
        { name: `${last} household`, relationship: 'Parent', phone: `+966 50 1${String(100 + i).slice(-3)} ${String(2000 + i)}`, isPrimary: true },
      ],
      attendance: flatAttendance(90 + (i % 8)),
    });
  }
  return out;
}

const ALL_SEED_STUDENTS: SeedStudent[] = [...NAMED, ...fillerStudents(31)];

export const STUDENTS: Student[] = ALL_SEED_STUDENTS.map((s) => ({
  id: s.id,
  firstName: s.firstName,
  lastName: s.lastName,
  preferredName: s.preferredName,
  yearGroup: s.yearGroup,
  tutorGroup: s.tutorGroup,
  campus: s.campus,
  dateOfBirth: s.dob,
  photoInitial: (s.preferredName ?? s.firstName)[0].toUpperCase(),
  guardians: s.guardians,
  flagIds: [],
  attendanceByWeek: s.attendance,
  ...meta('system'),
}));

const sid = (key: string) => `stu-${key}`;

// ---------------------------------------------------------------------------
// Flags (guidance line shown on the student profile header)
// ---------------------------------------------------------------------------

export const FLAGS: Flag[] = [
  {
    id: id('flag'),
    studentId: sid('layla-alotaibi'),
    sourcePortal: 'medical',
    label: 'Severe allergy',
    guidance: 'Severe nut allergy. Epipen travels with her at all times. See the emergency card before any trip or activity.',
    visibleToRoles: ['teacher', 'pastoral-lead', 'nurse', 'dsl', 'senior-dsl'],
    severity: 'severe',
    ...meta('staff-priya-nair'),
  },
  {
    id: id('flag'),
    studentId: sid('yusuf-rahman'),
    sourcePortal: 'medical',
    label: 'Healthcare plan',
    guidance: 'Type 1 diabetes. Checks blood sugar before lunch and may need insulin — see the healthcare plan for what to do.',
    visibleToRoles: ['teacher', 'pastoral-lead', 'nurse', 'dsl', 'senior-dsl'],
    severity: 'moderate',
    ...meta('staff-priya-nair'),
  },
  {
    id: id('flag'),
    studentId: sid('hana-nakamura'),
    sourcePortal: 'wellbeing',
    label: 'Support plan in place',
    guidance: 'Has a support plan with regular check-ins. Be patient if she asks to step out of class — this is expected and agreed.',
    visibleToRoles: ['teacher', 'pastoral-lead', 'dsl', 'senior-dsl'],
    severity: 'info',
    ...meta('staff-tom-reilly'),
  },
  {
    id: id('flag'),
    studentId: sid('sophie-brennan'),
    sourcePortal: 'safeguarding',
    label: 'Active support',
    guidance: 'Being supported by the safeguarding team. If you have a concern, raise it rather than approaching this directly.',
    visibleToRoles: ['pastoral-lead', 'dsl', 'senior-dsl'],
    severity: 'info',
    ...meta('staff-dan-whitfield'),
  },
];

for (const f of FLAGS) {
  const s = STUDENTS.find((st) => st.id === f.studentId);
  if (s) s.flagIds.push(f.id);
}

// ---------------------------------------------------------------------------
// Safeguarding cases
// ---------------------------------------------------------------------------

export const CASES: Case[] = [];
export const ENTRIES: Entry[] = [];
export const ACTIONS: Action[] = [];
export const CONTACT_RECORDS: ContactRecord[] = [];

function addEntry(e: Omit<Entry, 'id'> & Partial<Pick<Entry, 'id'>>) {
  const entry: Entry = { id: id('entry'), ...e } as Entry;
  ENTRIES.push(entry);
  return entry;
}

// --- Sophie Brennan: open, elevated, worked example ------------------------
const sophieCase: Case = {
  id: id('case'),
  studentId: sid('sophie-brennan'),
  portal: 'safeguarding',
  category: 'Emotional wellbeing',
  level: 'elevated',
  status: 'open',
  ownerId: 'staff-dan-whitfield',
  reportedById: 'staff-sarah-ahmed',
  reportedAt: fromAnchor(-11, 8, 40),
  occurredAt: fromAnchor(-11, 8, 15),
  location: 'Form room, 11S',
  account:
    'Sophie came to me before registration visibly upset and said she had not been sleeping and was finding it hard to cope with the workload and things at home. She has seemed withdrawn for the past two weeks and has stopped sitting with her usual friend group at break.',
  studentWords: 'I just feel like I cannot keep up with anything at the moment and I do not want to talk to my parents about it.',
  othersPresent: 'None — one to one conversation before registration.',
  triagedAt: fromAnchor(-11, 10, 5),
  triagedById: 'staff-dan-whitfield',
  nextReviewDue: fromAnchor(1, 9, 0),
  ...meta('staff-sarah-ahmed', fromAnchor(-11, 8, 40)),
};
CASES.push(sophieCase);

addEntry({
  caseId: sophieCase.id,
  type: 'level-change',
  body: 'Triaged and set to elevated. Assigned to Dan Whitfield as owner. Weekly review while support is put in place.',
  authorId: 'staff-dan-whitfield',
  toLevel: 'elevated',
  ...meta('staff-dan-whitfield', fromAnchor(-11, 10, 5)),
});
addEntry({
  caseId: sophieCase.id,
  type: 'note',
  body: 'Met with Sophie for a longer conversation. She confirmed things have been difficult at home since her parents separated in the summer. Agreed she would check in with Tom Reilly weekly.',
  authorId: 'staff-dan-whitfield',
  ...meta('staff-dan-whitfield', fromAnchor(-8, 13, 0)),
});
addEntry({
  caseId: sophieCase.id,
  type: 'handover',
  body: 'Weekly check-ins handed to Tom Reilly (pastoral lead, Year 9) to run alongside safeguarding oversight.',
  authorId: 'staff-dan-whitfield',
  ...meta('staff-dan-whitfield', fromAnchor(-7, 9, 0)),
});

CONTACT_RECORDS.push({
  id: id('contact'),
  caseId: sophieCase.id,
  method: 'phone',
  contactedAt: fromAnchor(-10, 16, 30),
  contactedById: 'staff-dan-whitfield',
  personSpoken: 'Claire Brennan',
  relationship: 'Mother',
  discussed: 'Explained the school had noticed Sophie seemed low and wanted to check in and offer support.',
  agreed: 'Claire welcomed the contact and agreed to weekly check-ins with Tom Reilly. She will speak to the family GP.',
  nextStep: 'Follow up call in two weeks to see how things are at home.',
  isException: false,
  ...meta('staff-dan-whitfield', fromAnchor(-10, 16, 30)),
});

ACTIONS.push(
  {
    id: id('action'),
    caseId: sophieCase.id,
    description: 'Weekly check-in with Sophie',
    ownerId: 'staff-tom-reilly',
    dueAt: fromAnchor(-2, 15, 0),
    completedAt: fromAnchor(-2, 15, 20),
    outcome: 'Sophie says the weekly check-ins are helping. Sleep still poor but mood a little improved.',
    ...meta('staff-dan-whitfield', fromAnchor(-7, 9, 0)),
  },
  {
    id: id('action'),
    caseId: sophieCase.id,
    description: 'Follow-up call with Claire Brennan',
    ownerId: 'staff-dan-whitfield',
    dueAt: fromAnchor(-1, 16, 0),
    ...meta('staff-dan-whitfield', fromAnchor(-10, 16, 30)),
  },
  {
    id: id('action'),
    caseId: sophieCase.id,
    description: 'Check in with Sophie before the review',
    ownerId: 'staff-tom-reilly',
    dueAt: fromAnchor(0, 17, 0),
    ...meta('staff-dan-whitfield', fromAnchor(-1, 9, 0)),
  },
);

// --- Daniel Okoro: recurrence -----------------------------------------------
const danielClosed1: Case = {
  id: id('case'),
  studentId: sid('daniel-okoro'),
  portal: 'safeguarding',
  category: 'Peer relationships',
  level: 'monitored',
  status: 'closed',
  ownerId: 'staff-dan-whitfield',
  reportedById: 'staff-sarah-ahmed',
  reportedAt: fromAnchor(-150, 9, 0),
  occurredAt: fromAnchor(-150, 8, 45),
  location: 'Playground',
  account: 'Daniel reported being excluded from a friendship group and feeling upset about comments made in a group chat.',
  triagedAt: fromAnchor(-150, 11, 0),
  triagedById: 'staff-dan-whitfield',
  closedAt: fromAnchor(-130, 10, 0),
  closedById: 'staff-dan-whitfield',
  closureStatement:
    'Group chat issue resolved through mediated conversation between the students involved. Daniel reports feeling included again and no further incidents in three weeks of monitoring.',
  ...meta('staff-sarah-ahmed', fromAnchor(-150, 9, 0)),
};
const danielClosed2: Case = {
  id: id('case'),
  studentId: sid('daniel-okoro'),
  portal: 'safeguarding',
  category: 'Behaviour',
  level: 'monitored',
  status: 'closed',
  ownerId: 'staff-dan-whitfield',
  reportedById: 'staff-tom-reilly',
  reportedAt: fromAnchor(-95, 9, 30),
  occurredAt: fromAnchor(-95, 9, 0),
  location: 'Classroom 8K',
  account: 'Daniel had an outburst in class after being teased about his reading age. Teacher separated the students and referred to pastoral.',
  triagedAt: fromAnchor(-95, 12, 0),
  triagedById: 'staff-dan-whitfield',
  closedAt: fromAnchor(-80, 14, 0),
  closedById: 'staff-dan-whitfield',
  closureStatement:
    'Underlying teasing addressed with the class. Daniel met with pastoral support twice; no further outbursts recorded. Closing with no ongoing action.',
  ...meta('staff-tom-reilly', fromAnchor(-95, 9, 30)),
};
CASES.push(danielClosed1, danielClosed2);

const danielNew: Case = {
  id: id('case'),
  studentId: sid('daniel-okoro'),
  portal: 'safeguarding',
  category: 'Peer relationships',
  level: 'monitored',
  status: 'untriaged',
  reportedById: 'staff-sarah-ahmed',
  reportedAt: fromAnchor(-1, 14, 10),
  occurredAt: fromAnchor(-1, 13, 45),
  location: 'Corridor outside 8K',
  account:
    'Daniel was found sitting alone outside the classroom during lunch, said he "did not want to talk about it" when asked. Seemed withdrawn for the rest of the afternoon.',
  ...meta('staff-sarah-ahmed', fromAnchor(-1, 14, 10)),
};
CASES.push(danielNew);

// --- Grace Thompson: immediate, closed last month, good record -------------
const graceCase: Case = {
  id: id('case'),
  studentId: sid('grace-thompson'),
  portal: 'safeguarding',
  category: 'Family circumstances',
  level: 'immediate',
  status: 'closed',
  ownerId: 'staff-emily-carter',
  reportedById: 'staff-tom-reilly',
  reportedAt: fromAnchor(-35, 8, 20),
  occurredAt: fromAnchor(-35, 8, 0),
  location: "DSL's office",
  account:
    'Grace disclosed that there had been a serious incident at home over the weekend and that she did not feel safe. Immediate level set and external agency contacted the same day in line with policy.',
  studentWords: 'I do not want to go home after school today.',
  othersPresent: 'Tom Reilly present for the initial conversation.',
  triagedAt: fromAnchor(-35, 9, 0),
  triagedById: 'staff-emily-carter',
  closedAt: fromAnchor(-21, 11, 0),
  closedById: 'staff-emily-carter',
  closureStatement:
    'External agency involved from day one and confirmed appropriate safeguards are now in place at home. Grace has been seen weekly throughout, attendance and mood have been stable for two weeks, and both Grace and her father confirm they feel supported. All four closure conditions met.',
  ...meta('staff-tom-reilly', fromAnchor(-35, 8, 20)),
};
CASES.push(graceCase);
addEntry({
  caseId: graceCase.id,
  type: 'level-change',
  body: 'Set to immediate. External agency referral made same day. Emily Carter taking ownership directly.',
  authorId: 'staff-emily-carter',
  toLevel: 'immediate',
  ...meta('staff-emily-carter', fromAnchor(-35, 9, 0)),
});
addEntry({
  caseId: graceCase.id,
  type: 'note',
  body: 'External agency confirmed a safety plan is in place at home. Continuing weekly check-ins with Grace.',
  authorId: 'staff-emily-carter',
  ...meta('staff-emily-carter', fromAnchor(-25, 10, 0)),
});
CONTACT_RECORDS.push({
  id: id('contact'),
  caseId: graceCase.id,
  method: 'in person',
  contactedAt: fromAnchor(-35, 15, 0),
  contactedById: 'staff-emily-carter',
  personSpoken: 'Michael Thompson',
  relationship: 'Father',
  discussed: 'Concerns raised by Grace and the involvement of an external agency.',
  agreed: 'Father agreed to the agency visit and to weekly contact with the school while the plan is in place.',
  nextStep: 'Weekly call until case review.',
  isException: false,
  ...meta('staff-emily-carter', fromAnchor(-35, 15, 0)),
});
ACTIONS.push({
  id: id('action'),
  caseId: graceCase.id,
  description: 'Weekly check-in with Grace',
  ownerId: 'staff-emily-carter',
  dueAt: fromAnchor(-22, 10, 0),
  completedAt: fromAnchor(-22, 10, 15),
  outcome: 'Grace reports feeling settled. Attendance and mood stable for two weeks.',
  ...meta('staff-emily-carter', fromAnchor(-35, 9, 0)),
});

// --- Two quiet monitored cases ----------------------------------------------
const fatimaCase: Case = {
  id: id('case'),
  studentId: sid('fatima-zahra'),
  portal: 'safeguarding',
  category: 'Attendance concern',
  level: 'monitored',
  status: 'open',
  ownerId: 'staff-dan-whitfield',
  reportedById: 'staff-tom-reilly',
  reportedAt: fromAnchor(-18, 9, 0),
  occurredAt: fromAnchor(-18, 8, 45),
  location: 'Form room, 9G',
  account: 'Fatima has had several unexplained late arrivals over the past three weeks. Tutor raised as a precaution.',
  triagedAt: fromAnchor(-17, 9, 0),
  triagedById: 'staff-dan-whitfield',
  nextReviewDue: fromAnchor(14, 9, 0),
  ...meta('staff-tom-reilly', fromAnchor(-18, 9, 0)),
};
const ibrahimCase: Case = {
  id: id('case'),
  studentId: sid('ibrahim-saleh'),
  portal: 'safeguarding',
  category: 'Behaviour',
  level: 'monitored',
  status: 'open',
  ownerId: 'staff-dan-whitfield',
  reportedById: 'staff-sarah-ahmed',
  reportedAt: fromAnchor(-25, 13, 0),
  occurredAt: fromAnchor(-25, 12, 30),
  location: 'Playground',
  account: 'Ibrahim was involved in a minor scuffle with another student. Being monitored as part of a wider pattern of low-level incidents this term.',
  triagedAt: fromAnchor(-24, 9, 0),
  triagedById: 'staff-dan-whitfield',
  nextReviewDue: fromAnchor(9, 9, 0),
  ...meta('staff-sarah-ahmed', fromAnchor(-25, 13, 0)),
};
CASES.push(fatimaCase, ibrahimCase);

// ---------------------------------------------------------------------------
// Medical records
// ---------------------------------------------------------------------------

export const MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: id('med'),
    studentId: sid('layla-alotaibi'),
    type: 'allergy',
    severity: 'severe',
    description: 'Severe allergy to tree nuts and peanuts. History of anaphylaxis (age 6).',
    protocol:
      'Carries two epipens at all times. If signs of a reaction: use epipen immediately, call an ambulance, contact parents, do not leave her alone. Do not wait to see if symptoms improve.',
    medicationName: 'Epipen (adrenaline auto-injector)',
    medicationDose: '0.3mg',
    medicationFrequency: 'As needed in a reaction, second dose after 5 minutes if no improvement',
    medicationLocation: 'Carried by student and duplicate in first aid office',
    reviewDate: fromAnchor(60, 9, 0),
    ...meta('staff-priya-nair', fromAnchor(-300)),
  },
  {
    id: id('med'),
    studentId: sid('yusuf-rahman'),
    type: 'plan',
    severity: 'moderate',
    description: 'Type 1 diabetes. Individual healthcare plan in place.',
    protocol:
      'Checks blood glucose before lunch and if he seems unwell. Insulin given at lunchtime by the nurse. If he seems shaky, confused or unusually quiet, treat as low blood sugar: give a sugary drink and call the nurse immediately.',
    reviewDate: fromAnchor(45, 9, 0),
    ...meta('staff-priya-nair', fromAnchor(-280)),
  },
  {
    id: id('med'),
    studentId: sid('yusuf-rahman'),
    type: 'medication',
    description: 'Lunchtime insulin, administered by the nurse',
    medicationName: 'Insulin (rapid-acting)',
    medicationDose: 'As per sliding scale in healthcare plan',
    medicationFrequency: 'Daily at lunchtime',
    medicationLocation: 'Medical office',
    ...meta('staff-priya-nair', fromAnchor(-280)),
  },
  {
    id: id('med'),
    studentId: sid('omar-haddad'),
    type: 'visit',
    description: 'Nurse visit: vague stomach pain',
    visitReason: 'Stomach ache, no other symptoms',
    visitTreatment: 'Rested in medical office for 20 minutes, offered water, symptoms settled',
    visitTimeIn: fromAnchor(-32, 10, 15),
    visitTimeOut: fromAnchor(-32, 10, 40),
    visitHomeContacted: false,
    ...meta('staff-priya-nair', fromAnchor(-32, 10, 40)),
  },
  {
    id: id('med'),
    studentId: sid('omar-haddad'),
    type: 'visit',
    description: 'Nurse visit: stomach pain, sent to sit with head down',
    visitReason: 'Stomach pain, looked pale',
    visitTreatment: 'Rested, offered water, symptoms settled after 30 minutes',
    visitTimeIn: fromAnchor(-19, 11, 0),
    visitTimeOut: fromAnchor(-19, 11, 30),
    visitHomeContacted: false,
    ...meta('staff-priya-nair', fromAnchor(-19, 11, 30)),
  },
  {
    id: id('med'),
    studentId: sid('omar-haddad'),
    type: 'visit',
    description: 'Nurse visit: stomach pain before period 3',
    visitReason: 'Stomach pain, said he felt "not right"',
    visitTreatment: 'Rested for 40 minutes. Home contacted this time given the pattern.',
    visitTimeIn: fromAnchor(-5, 9, 30),
    visitTimeOut: fromAnchor(-5, 10, 10),
    visitHomeContacted: true,
    ...meta('staff-priya-nair', fromAnchor(-5, 10, 10)),
  },
];

// Four routine visits today, for the daily medical view
const ROUTINE_TODAY = [
  { studentKey: 'filler-2', reason: 'Headache', treatment: 'Paracetamol given with parental consent on file, rested 20 minutes' },
  { studentKey: 'filler-5', reason: 'Grazed knee from PE', treatment: 'Cleaned and dressed' },
  { studentKey: 'filler-9', reason: 'Feeling faint, hot day', treatment: 'Rested in shade, water given, recovered fully' },
  { studentKey: 'filler-14', reason: 'Asthma inhaler check-in', treatment: 'Used own inhaler, breathing settled, technique checked' },
];
ROUTINE_TODAY.forEach((v, i) => {
  MEDICAL_RECORDS.push({
    id: id('med'),
    studentId: `stu-${v.studentKey}`,
    type: 'visit',
    description: v.reason,
    visitReason: v.reason,
    visitTreatment: v.treatment,
    visitTimeIn: fromAnchor(0, 8 + i, 30),
    visitTimeOut: fromAnchor(0, 8 + i, 50),
    visitHomeContacted: false,
    ...meta('staff-priya-nair', fromAnchor(0, 8 + i, 50)),
  });
});

// ---------------------------------------------------------------------------
// Wellbeing records
// ---------------------------------------------------------------------------

export const WELLBEING_RECORDS: WellbeingRecord[] = [
  {
    id: id('well'),
    studentId: sid('omar-haddad'),
    type: 'pastoral-note',
    summary: 'Seemed quiet at break, said he was "just tired". Keeping an eye on this alongside the nurse visits.',
    mood: 'low',
    authorId: 'staff-tom-reilly',
    ...meta('staff-tom-reilly', fromAnchor(-4, 13, 0)),
  },
  {
    id: id('well'),
    studentId: sid('hana-nakamura'),
    type: 'session',
    summary: 'Referred for counselling to support with anxiety around exams. First session booked.',
    authorId: 'staff-tom-reilly',
    referralStatus: 'in progress',
    ...meta('staff-tom-reilly', fromAnchor(-20, 9, 0)),
  },
  {
    id: id('well'),
    studentId: sid('hana-nakamura'),
    type: 'support-plan',
    summary: 'Support plan to build exam-related coping strategies and reduce anxiety around assessments.',
    authorId: 'staff-tom-reilly',
    goals: [
      { goal: 'Use two agreed grounding techniques before a timed assessment', reviewDate: fromAnchor(10, 9, 0), status: 'on track' },
      { goal: 'Attend weekly check-in with pastoral lead', reviewDate: fromAnchor(10, 9, 0), status: 'on track' },
    ],
    planReviewDate: fromAnchor(10, 9, 0),
    planStatus: 'active',
    ...meta('staff-tom-reilly', fromAnchor(-20, 9, 30)),
  },
];

// Year 7 check-in set with a scatter of moods
const YEAR7_MOODS: WellbeingRecord['mood'][] = ['positive', 'positive', 'mixed', 'positive', 'low', 'mixed', 'positive', 'mixed'];
STUDENTS.filter((s) => s.yearGroup === 7).slice(0, 8).forEach((s, i) => {
  WELLBEING_RECORDS.push({
    id: id('well'),
    studentId: s.id,
    type: 'check-in',
    summary: 'Termly wellbeing check-in',
    mood: YEAR7_MOODS[i % YEAR7_MOODS.length],
    authorId: 'staff-tom-reilly',
    ...meta('staff-tom-reilly', fromAnchor(-6, 9, 0)),
  });
});

// Two closed support plans
['filler-3', 'filler-7'].forEach((key, i) => {
  WELLBEING_RECORDS.push({
    id: id('well'),
    studentId: `stu-${key}`,
    type: 'support-plan',
    summary: 'Short support plan to help settle back in after a period of absence. Goals met, plan closed.',
    authorId: 'staff-tom-reilly',
    goals: [{ goal: 'Attend two check-ins per week', reviewDate: fromAnchor(-40 + i, 9, 0), status: 'met' }],
    planReviewDate: fromAnchor(-40 + i, 9, 0),
    planStatus: 'closed',
    ...meta('staff-tom-reilly', fromAnchor(-70 + i, 9, 0)),
  });
});

// ---------------------------------------------------------------------------
// Pattern flags (system flags drawn from the dummy data — never a decision)
// ---------------------------------------------------------------------------

export const PATTERN_FLAGS: PatternFlagState[] = [
  {
    id: id('pattern'),
    studentId: sid('omar-haddad'),
    summary: 'Three nurse visits and a 15 percentage point attendance drop in the past five weeks.',
    basedOn: MEDICAL_RECORDS.filter((m) => m.studentId === sid('omar-haddad') && m.type === 'visit').map((m) => m.id),
    status: 'open',
    createdAt: fromAnchor(-5, 10, 30),
  },
  {
    id: id('pattern'),
    studentId: sid('daniel-okoro'),
    summary: 'Two closed safeguarding concerns in the past five months. This new report may be part of the same pattern.',
    basedOn: [danielClosed1.id, danielClosed2.id],
    status: 'open',
    createdAt: fromAnchor(-1, 14, 15),
  },
];

// ---------------------------------------------------------------------------
// Activities (for the trip view)
// ---------------------------------------------------------------------------

const tripStudentIds = [
  sid('layla-alotaibi'),
  sid('yusuf-rahman'),
  sid('omar-haddad'),
  sid('hana-nakamura'),
  'stu-filler-1',
  'stu-filler-4',
  'stu-filler-6',
  'stu-filler-8',
];

export const ACTIVITIES: Activity[] = [
  {
    id: id('activity'),
    name: 'Al-Ula residential trip',
    type: 'trip',
    startsAt: fromAnchor(6, 7, 0),
    endsAt: fromAnchor(9, 18, 0),
    leadId: 'staff-tom-reilly',
    studentIds: tripStudentIds,
    location: 'Al-Ula, Saudi Arabia',
    ...meta('staff-tom-reilly', fromAnchor(-20)),
  },
  {
    id: id('activity'),
    name: 'Inter-school football fixture',
    type: 'fixture',
    startsAt: fromAnchor(3, 15, 0),
    endsAt: fromAnchor(3, 17, 0),
    leadId: 'staff-priya-nair',
    studentIds: ['stu-filler-10', 'stu-filler-11', sid('omar-haddad')],
    location: 'Away — Riyadh Grammar',
    ...meta('staff-priya-nair', fromAnchor(-10)),
  },
];

// ---------------------------------------------------------------------------
// Audit events — seed history so the log and "who has viewed this" aren't empty
// ---------------------------------------------------------------------------

export const AUDIT_EVENTS: AuditEvent[] = [
  {
    id: id('audit'),
    actorId: 'staff-dan-whitfield',
    action: 'view',
    entityType: 'case',
    entityId: sophieCase.id,
    entityLabel: "Sophie Brennan's case",
    at: fromAnchor(-2, 8, 14),
  },
  {
    id: id('audit'),
    actorId: 'staff-emily-carter',
    action: 'view',
    entityType: 'case',
    entityId: sophieCase.id,
    entityLabel: "Sophie Brennan's case",
    at: fromAnchor(-1, 17, 2),
  },
  {
    id: id('audit'),
    actorId: 'staff-tom-reilly',
    action: 'view',
    entityType: 'case',
    entityId: sophieCase.id,
    entityLabel: "Sophie Brennan's case",
    at: fromAnchor(-3, 9, 45),
  },
  {
    id: id('audit'),
    actorId: 'staff-dan-whitfield',
    action: 'create',
    entityType: 'case',
    entityId: sophieCase.id,
    entityLabel: "Sophie Brennan's case",
    at: fromAnchor(-11, 10, 5),
    context: 'Triaged and set to elevated',
  },
  {
    id: id('audit'),
    actorId: 'staff-priya-nair',
    action: 'view',
    entityType: 'medical-record',
    entityId: sid('layla-alotaibi'),
    entityLabel: "Layla Al-Otaibi's medical record",
    at: fromAnchor(-6, 8, 0),
  },
  {
    id: id('audit'),
    actorId: 'staff-emily-carter',
    action: 'view',
    entityType: 'audit-log',
    entityId: 'audit-log',
    entityLabel: 'the audit log',
    at: fromAnchor(-1, 12, 0),
  },
];

export const SEED_SEQUENCE = seq;
