import { MOCK_MODE } from '@/lib/env';
import { realService } from './real';
import { mockService } from './mock';

export const service = MOCK_MODE ? mockService : realService;
export type { PortalService, SyncCartLine, CreateSessionInput } from './types';
