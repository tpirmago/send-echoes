export const ECHO_TYPES = [
  'myself',
  'goals',
  'voice',
] as const;

export type EchoType = (typeof ECHO_TYPES)[number];

export interface Echo {
  id: string;
  type: EchoType;
  title: string;
  content?: string;
  unlockAt: Date;
  isUnlocked: boolean;
  openedAt?: Date;
  createdAt: Date;
  recipientEmail?: string;
}
