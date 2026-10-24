import { describe, expect, test } from 'bun:test';
import { canInviteAdmins, inviteSchema } from './admin-rules';
describe('Admin invitations', () => {
  test('owner can assign admin access', () => {
    expect(canInviteAdmins({ is_owner: true, user_id: 'james' }, 'james')).toBe(true);
  });
  test('other admins cannot assign admin access', () => {
    expect(canInviteAdmins({ is_owner: false, user_id: 'other' }, 'other')).toBe(false);
  });
  test('owner status belonging to another account is rejected', () => {
    expect(canInviteAdmins({ is_owner: true, user_id: 'james' }, 'other')).toBe(false);
  });
  test('email invitations normalize James email', () => {
    expect(inviteSchema.parse({ email: ' JamesLilja@hotmail.com ' }).email).toBe('jameslilja@hotmail.com');
    expect(inviteSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });
});