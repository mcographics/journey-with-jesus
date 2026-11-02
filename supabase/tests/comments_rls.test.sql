begin;
select plan(4);

insert into public.published_episodes (id, published)
values ('rls-test-episode', true);

insert into public.episode_comments (episode_id, display_name, body, status)
values
  ('rls-test-episode', 'Approved viewer', 'A visible comment.', 'approved'),
  ('rls-test-episode', 'Pending viewer', 'A comment awaiting review.', 'pending');

set local role anon;

select results_eq(
  $$select status::text from public.episode_comments order by status$$,
  $$values ('approved'::text)$$,
  'anonymous visitors can read approved comments only'
);

select throws_ok(
  $$insert into public.episode_comments (episode_id, display_name, body) values ('rls-test-episode', 'Bypass', 'Direct insert attempt')$$,
  '42501', null,
  'anonymous visitors cannot insert comments directly'
);

select throws_ok(
  $$select * from public.published_episodes$$,
  '42501', null,
  'anonymous visitors cannot read or alter the episode allowlist'
);

select throws_ok(
  $$select * from public.submit_episode_comment('rls-test-episode', 'Bypass', 'RPC attempt', repeat('a', 64))$$,
  '42501', null,
  'anonymous visitors cannot call the privileged submission RPC'
);

select * from finish();
rollback;
