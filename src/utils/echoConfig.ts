import { ECHO_TYPES } from '../types/echo';
import type { EchoType } from '../types/echo';

export { ECHO_TYPES };

export interface EchoConfig {
  label: string;
  description: string;
  color: string;
  gradient: string;
  softGradient: string;
}

export const ECHO_CONFIG: Record<EchoType, EchoConfig> = {
  myself: {
    label: 'Echo to Myself',
    description: 'A letter to your future self — sealed until the moment you choose',
    color: '#8B5CF6',
    gradient: 'linear-gradient(180deg, #8B5CF6 0%, #EDE9FE 60%, #FFFFFF 100%)',
    softGradient: 'linear-gradient(180deg, #C4B5FD 0%, #F5F3FF 60%, #FFFFFF 100%)',
  },
  goals: {
    label: 'Goals Echo',
    description: 'Write down what you want to achieve and revisit it when it unlocks',
    color: '#14B8A6',
    gradient: 'linear-gradient(180deg, #14B8A6 0%, #CCFBF1 60%, #FFFFFF 100%)',
    softGradient: 'linear-gradient(180deg, #5EEAD4 0%, #F0FDFA 60%, #FFFFFF 100%)',
  },
  voice: {
    label: 'Voice Echo',
    description: 'Record your voice or upload an audio file — preserved exactly as it sounds',
    color: '#EC4899',
    gradient: 'linear-gradient(180deg, #EC4899 0%, #FCE7F3 60%, #FFFFFF 100%)',
    softGradient: 'linear-gradient(180deg, #F9A8D4 0%, #FDF2F8 60%, #FFFFFF 100%)',
  },

};
