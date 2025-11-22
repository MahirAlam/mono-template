-- Insert Post Visibility Options
-- Based on POST_VISIBILITY_CONFIG from packages/config/src/info/post.tsx

INSERT INTO "tera-tok_post_visibility" (id, name, description, filter)
VALUES
  (
    'c38b216c-e522-4a60-8422-96f7c5053b87',
    'Public',
    'Visible to anyone on or off Tera-Tok',
    ARRAY['public']
  ),
  (
    '87a74cb1-f5e1-4b1e-8419-722c1d1a6a84',
    'Friends',
    'Visible to your friends on Tera-Tok',
    ARRAY['friends']
  ),
  (
    'f8220a2b-8a8b-4b43-8512-3f24d2a6a422',
    'Only Me',
    'Visible only to you',
    ARRAY['only-me']
  ),
  (
    '1f9d6c3a-8b1e-4f3e-9e7b-9f6e1a3b2c5d',
    'Friends Except...',
    'Visible to your friends, except specific people',
    ARRAY['friends-except']
  ),
  (
    '5e2b8f7c-1d9a-4c8e-9b3a-8f6a9c1d3e5f',
    'Specific Friends',
    'Only show to some of your friends',
    ARRAY['specific-friends']
  ),
  (
    'd9c8b7a6-3e5f-4d1a-9b8c-7a6b5c4d3e2f',
    'Close Friends',
    'Your custom ''Close Friends'' list',
    ARRAY['close-friends']
  )
ON CONFLICT (id) DO NOTHING;
