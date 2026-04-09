-- Phase 4: Material categories + preset seed (idempotent)

-- 중복 카테고리 정리 (이전 실행에서 unique 제약 없이 삽입된 경우)
delete from public.iso_material_categories a
using public.iso_material_categories b
where a.ctid < b.ctid
  and a.name = b.name
  and a.parent_type = b.parent_type;

-- unique 제약 추가 (on conflict 작동 보장)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'iso_material_categories_name_parent_type_key'
  ) then
    alter table public.iso_material_categories
      add constraint iso_material_categories_name_parent_type_key
      unique (name, parent_type);
  end if;
end $$;

insert into public.iso_material_categories (name, parent_type, sort_order) values
  ('타일', 'floor', 10),
  ('마루', 'floor', 20),
  ('대리석/기타', 'floor', 30),
  ('페인트', 'wall', 10),
  ('타일/벽돌', 'wall', 20),
  ('우드/기타', 'wall', 30),
  ('걸레받이', 'baseboard', 10),
  ('천장', 'ceiling', 10)
on conflict (name, parent_type) do nothing;

-- 자재 프리셋은 iso_materials 테이블이 비어있을 때만 삽입
do $$
begin
  if (select count(*) from public.iso_materials where is_preset = true) > 0 then
    return;
  end if;

  insert into public.iso_materials (category_id, name, brand, color_hex, pattern_type, tile_size_mm, is_preset)
  select c.id, v.name, v.brand, v.color_hex, v.pattern_type, v.tile_size_mm, true
  from (values
    -- 바닥 - 타일
    ('floor', '타일', '포세린 타일 600', '한샘', '#D4C5A9', 'tile', 600),
    ('floor', '타일', '폴리싱 타일', 'LX하우시스', '#C8B898', 'tile', 600),
    ('floor', '타일', '데코 타일', '동화', '#D0C0A0', 'tile', 400),
    ('floor', '타일', '화이트 타일', '한샘', '#EFEAE0', 'tile', 600),
    -- 바닥 - 마루
    ('floor', '마루', '원목 마루 오크', '구정마루', '#B8956A', 'wood', 1200),
    ('floor', '마루', '강마루 월넛', 'LX하우시스', '#7B5A3F', 'wood', 1200),
    ('floor', '마루', '헤링본 오크', '구정마루', '#A07850', 'herringbone', 600),
    ('floor', '마루', '강마루 내추럴', '동화', '#C8A878', 'wood', 1200),
    -- 바닥 - 대리석/기타
    ('floor', '대리석/기타', '대리석 카라라', NULL, '#E8E0D0', 'marble', 600),
    ('floor', '대리석/기타', '콘크리트', NULL, '#A8A8A0', 'concrete', 800),
    ('floor', '대리석/기타', '테라조', NULL, '#D8D0C0', 'terrazzo', 600),
    -- 벽 - 페인트
    ('wall', '페인트', '화이트 페인트', '벤자민무어', '#F0EDE8', 'solid', NULL),
    ('wall', '페인트', '라이트 그레이', '벤자민무어', '#D8D5D0', 'solid', NULL),
    ('wall', '페인트', '베이지', '벤자민무어', '#E8DFD0', 'solid', NULL),
    ('wall', '페인트', '민트', '벤자민무어', '#C8E0D8', 'solid', NULL),
    ('wall', '페인트', '네이비', '벤자민무어', '#2C3E6B', 'solid', NULL),
    ('wall', '페인트', '웜 화이트', '벤자민무어', '#F8F2E8', 'solid', NULL),
    -- 벽 - 타일/벽돌
    ('wall', '타일/벽돌', '서브웨이 타일', NULL, '#F0F0E8', 'subway', 150),
    ('wall', '타일/벽돌', '화이트 벽돌', NULL, '#E8DED0', 'brick', 200),
    ('wall', '타일/벽돌', '레드 벽돌', NULL, '#C07050', 'brick', 200),
    ('wall', '타일/벽돌', '그레이 벽돌', NULL, '#908070', 'brick', 200),
    -- 벽 - 우드/기타
    ('wall', '우드/기타', '우드 패널', NULL, '#B89070', 'wood', 300),
    ('wall', '우드/기타', '시멘트', NULL, '#B0ADA8', 'concrete', 500),
    -- 걸레받이
    ('baseboard', '걸레받이', '화이트 PVC', 'LX하우시스', '#F0EDE8', 'solid', NULL),
    ('baseboard', '걸레받이', '오크 우드', NULL, '#A08060', 'solid', NULL),
    ('baseboard', '걸레받이', '월넛', NULL, '#6B4C3B', 'solid', NULL),
    ('baseboard', '걸레받이', '알루미늄', NULL, '#C0C0C0', 'solid', NULL),
    ('baseboard', '걸레받이', '블랙', NULL, '#3A3A3A', 'solid', NULL),
    ('baseboard', '걸레받이', '그레이', NULL, '#909090', 'solid', NULL),
    -- 천장
    ('ceiling', '천장', '화이트', NULL, '#FAFAF5', 'solid', NULL),
    ('ceiling', '천장', '아이보리', NULL, '#F5F0E0', 'solid', NULL),
    ('ceiling', '천장', '라이트 그레이', NULL, '#E8E8E0', 'solid', NULL)
  ) as v(p_type, cat_name, name, brand, color_hex, pattern_type, tile_size_mm)
  join public.iso_material_categories c
    on c.parent_type = v.p_type and c.name = v.cat_name;
end $$;
