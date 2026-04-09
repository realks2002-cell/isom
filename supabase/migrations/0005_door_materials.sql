-- Phase 4 확장: 도어 카테고리 및 프리셋

-- parent_type check constraint에 'door' 추가 (기존 제약 제거 후 재생성)
alter table public.iso_material_categories
  drop constraint if exists iso_material_categories_parent_type_check;
alter table public.iso_material_categories
  add constraint iso_material_categories_parent_type_check
  check (parent_type in ('floor', 'wall', 'baseboard', 'ceiling', 'door'));

-- 도어 카테고리
insert into public.iso_material_categories (name, parent_type, sort_order) values
  ('도어', 'door', 10)
on conflict (name, parent_type) do nothing;

-- 도어 프리셋
do $$
begin
  if (select count(*) from public.iso_materials m
      join public.iso_material_categories c on c.id = m.category_id
      where c.parent_type = 'door') > 0 then
    return;
  end if;

  insert into public.iso_materials (category_id, name, brand, color_hex, pattern_type, is_preset)
  select c.id, v.name, v.brand, v.color_hex, 'solid', true
  from (values
    ('화이트 도어', NULL, '#F0EDE8'),
    ('오크 우드', NULL, '#B8956A'),
    ('월넛', NULL, '#6B4C3B'),
    ('블랙', NULL, '#2A2A2A'),
    ('그레이', NULL, '#808080'),
    ('다크 브라운', NULL, '#4A3628'),
    ('내추럴 우드', NULL, '#C8A878'),
    ('매트 베이지', NULL, '#D8C8A8'),
    ('네이비 블루', NULL, '#2C3E6B'),
    ('버건디', NULL, '#6B2C3E')
  ) as v(name, brand, color_hex)
  cross join public.iso_material_categories c
  where c.parent_type = 'door' and c.name = '도어';
end $$;
