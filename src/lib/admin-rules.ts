import { z } from 'zod';

export const inviteSchema = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()) });
export const profileSchema = z.object({ display_name: z.string().trim().max(100), avatar_path: z.string().max(500).nullable() });
export const canInviteAdmins = (access: { is_owner: boolean; user_id: string | null } | null, userId: string) => Boolean(access?.is_owner && access.user_id === userId);