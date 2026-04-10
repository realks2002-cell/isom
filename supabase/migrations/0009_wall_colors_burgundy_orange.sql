-- 벽 페인트에 버건디/오렌지 컬러 추가

insert into public.iso_materials (category_id, name, brand, color_hex, pattern_type, tile_size_mm, is_preset, is_active)
select c.id, '버건디', '벤자민무어', '#6B1F2B', 'solid', NULL, true, true
from public.iso_material_categories c
where c.parent_type = 'wall' and c.name = '페인트'
on conflict do nothing;

insert into public.iso_materials (category_id, name, brand, color_hex, pattern_type, tile_size_mm, is_preset, is_active)
select c.id, '오렌지', '벤자민무어', '#E07B2A', 'solid', NULL, true, true
from public.iso_material_categories c
where c.parent_type = 'wall' and c.name = '페인트'
on conflict do nothing;
