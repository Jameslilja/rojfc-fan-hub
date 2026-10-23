import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { canInviteAdmins, inviteSchema } from './admin-rules';

export const inviteAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(inviteSchema)
  .handler(async ({ data, context }) => {
    const { data: role, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    const { data: access, error: accessError } = await context.supabase.from('admin_access').select('is_owner,user_id').eq('user_id', context.userId).maybeSingle();
    if (roleError || accessError || !role || !canInviteAdmins(access, context.userId)) throw new Error('Endast huvudadmin kan lägga till administratörer.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: existing, error } = await supabaseAdmin.rpc('approve_admin_email', { target_email: data.email, actor: context.userId });
    if (error) throw new Error('Kunde inte tilldela adminbehörighet.');
    if (existing) return { message: 'Kontot har nu adminbehörighet.' };
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
      redirectTo: 'https://rojfc-fan-hub.lovable.app/reset-password',
    });
    if (inviteError) throw new Error('Behörigheten är registrerad, men mejlet kunde inte skickas. Försök igen.');
    return { message: 'Inbjudan skickad via e-post.' };
  });

export const listAdmins = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: role } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  const { data: access } = await context.supabase.from('admin_access').select('is_owner,user_id').eq('user_id', context.userId).maybeSingle();
  if (!role || !canInviteAdmins(access, context.userId)) throw new Error('Ingen behörighet.');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data, error } = await supabaseAdmin.from('admin_access').select('email,is_owner,user_id').order('created_at');
  if (error) throw new Error('Kunde inte hämta administratörer.');
  return data;
});