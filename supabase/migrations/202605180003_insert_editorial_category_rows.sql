insert into public.categories (id, name, icon, slug, description, sort_order)
values
  ('gaming', 'วงการเกม', '📰', 'gaming', 'ข่าวทั่วไปในวงการเกม', 8),
  ('pc-console', 'PC/Console', '🎮', 'pc-console', 'ข่าวเกม PC และคอนโซล', 9)
on conflict (id) do update
set
  name = excluded.name,
  icon = excluded.icon,
  slug = excluded.slug,
  description = excluded.description,
  sort_order = excluded.sort_order;
