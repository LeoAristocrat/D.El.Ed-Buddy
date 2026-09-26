export type CardField = 'instituteName' | 'cardTitle' | 'fullName' | 'course' | 'session' | 'dob' | 'fatherName' | 'contact' | 'validity';
export type CardValues = Record<CardField, string>;
export type TextBlock = { x: number; y: number; width: number; size: number; minSize: number; lines: number; lineHeight: number; anchor?: 'start' | 'middle' };

// Templates own their layout and labels; institutes only supply defaults.
export const cardTemplates = {
  'student-id-v1': {
    width: 856, height: 540, widthMm: 85.6, heightMm: 54,
    colors: { header: '#164e48', paper: '#f5faf9', ink: '#14282a', badge: '#236b57', border: '#426962' },
    photo: { x: 40, y: 145, size: 210 },
    labels: { course: 'COURSE', session: 'SESSION', dob: 'DOB', fatherName: "FATHER’S NAME", contact: 'CONTACT NO.', validity: 'VALID UPTO' },
    signatures: ['Sign of Academic In-charge', 'Sign of Principal'],
    blocks: {
      instituteName: { x: 428, y: 48, width: 784, size: 31, minSize: 20, lines: 2, lineHeight: 32, anchor: 'middle' },
      cardTitle: { x: 428, y: 104, width: 784, size: 23, minSize: 16, lines: 1, lineHeight: 24, anchor: 'middle' },
      fullName: { x: 284, y: 164, width: 532, size: 32, minSize: 20, lines: 2, lineHeight: 34 },
      course: { x: 465, y: 238, width: 350, size: 21, minSize: 15, lines: 1, lineHeight: 23 },
      session: { x: 465, y: 277, width: 350, size: 21, minSize: 15, lines: 1, lineHeight: 23 },
      dob: { x: 465, y: 316, width: 350, size: 21, minSize: 15, lines: 1, lineHeight: 23 },
      fatherName: { x: 465, y: 355, width: 350, size: 21, minSize: 15, lines: 2, lineHeight: 23 },
      contact: { x: 465, y: 407, width: 350, size: 21, minSize: 15, lines: 1, lineHeight: 23 },
      validity: { x: 145, y: 407, width: 186, size: 20, minSize: 13, lines: 1, lineHeight: 22, anchor: 'middle' },
    } satisfies Record<CardField, TextBlock>,
  },
};
export const institutes = [
  { id: 'btc-hailakandi', name: 'Basic Training Centre, Hailakandi', template: 'student-id-v1' as const, cardTitle: 'STUDENT ID CARD', defaultValidity: '2027', course: 'D.El.Ed (PSTE)' },
];
export const initialCard: CardValues = {
  instituteName: institutes[0].name, cardTitle: institutes[0].cardTitle,
  fullName: '', course: institutes[0].course, session: '', dob: '', fatherName: '', contact: '', validity: institutes[0].defaultValidity,
};
