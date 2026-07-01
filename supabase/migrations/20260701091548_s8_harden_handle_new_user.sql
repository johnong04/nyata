-- Harden the signup trigger function: it must only run as a trigger, never as a
-- public RPC. Triggers execute as the table owner regardless of these grants, so
-- revoking EXECUTE from client roles keeps auto-provisioning working while closing
-- the exposed SECURITY DEFINER RPC surface (advisor lints 0028/0029).
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
