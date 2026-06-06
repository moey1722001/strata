delete from user_roles ur
using users u
where ur.user_id = u.id
  and (
    (u.email = 'resident@example.com' and ur.role <> 'resident')
    or (u.email = 'owner@northshorestrata.com.au' and ur.role <> 'portfolio_admin')
    or (u.email = 'manager@northshorestrata.com.au' and ur.role <> 'manager')
    or (u.email = 'committee@example.com' and ur.role <> 'committee')
    or (u.email = 'contractor@liftcare.com.au' and ur.role <> 'contractor')
  );

delete from building_memberships bm
using users u
where bm.user_id = u.id
  and u.email = 'manager@northshorestrata.com.au'
  and bm.building_id is distinct from '00000000-0000-4000-8000-000000000101'::uuid;
