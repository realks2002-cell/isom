import type { MaterialAssignment } from '@/types/room';

export type BuildingType = 'apartment' | 'office' | 'hospital' | 'retail' | 'school';

export const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: 'apartment', label: '아파트' },
  { value: 'office', label: '사무실' },
  { value: 'hospital', label: '병원' },
  { value: 'retail', label: '상가/카페' },
  { value: 'school', label: '학교/학원' },
];

export const ROOM_PRESETS: Record<BuildingType, { name: string; en: string }[]> = {
  apartment: [
    { name: '거실', en: 'living room' },
    { name: '안방', en: 'master bedroom' },
    { name: '작은방', en: 'bedroom' },
    { name: '아이방', en: "children's room" },
    { name: '주방', en: 'kitchen' },
    { name: '화장실', en: 'restroom' },
    { name: '욕실', en: 'bathroom' },
    { name: '현관', en: 'entrance' },
    { name: '베란다', en: 'balcony' },
    { name: '다용도실', en: 'utility room' },
    { name: '드레스룸', en: 'walk-in closet' },
    { name: '서재', en: 'study' },
  ],
  office: [
    { name: '사무실', en: 'office' },
    { name: '회의실', en: 'meeting room' },
    { name: '대표실', en: 'executive office' },
    { name: '접견실', en: 'reception room' },
    { name: '탕비실', en: 'pantry/break room' },
    { name: '화장실', en: 'restroom' },
    { name: '로비', en: 'lobby' },
    { name: '복도', en: 'hallway' },
    { name: '서버실', en: 'server room' },
    { name: '창고', en: 'storage' },
  ],
  hospital: [
    { name: '진료실', en: 'examination room' },
    { name: '대기실', en: 'waiting room' },
    { name: '수술실', en: 'operating room' },
    { name: '병실', en: 'patient room' },
    { name: '간호사실', en: 'nurse station' },
    { name: '접수/수납', en: 'reception/billing' },
    { name: '약국', en: 'pharmacy' },
    { name: '처치실', en: 'treatment room' },
    { name: '화장실', en: 'restroom' },
    { name: '복도', en: 'hallway' },
  ],
  retail: [
    { name: '매장', en: 'retail floor' },
    { name: '홀', en: 'dining hall' },
    { name: '주방', en: 'kitchen' },
    { name: '카운터', en: 'counter' },
    { name: '테라스', en: 'terrace' },
    { name: '화장실', en: 'restroom' },
    { name: '창고', en: 'storage' },
    { name: '사무실', en: 'back office' },
  ],
  school: [
    { name: '교실', en: 'classroom' },
    { name: '교무실', en: 'teachers room' },
    { name: '강의실', en: 'lecture room' },
    { name: '상담실', en: 'counseling room' },
    { name: '복도', en: 'hallway' },
    { name: '화장실', en: 'restroom' },
    { name: '도서관', en: 'library' },
    { name: '체육관', en: 'gym' },
    { name: '급식실', en: 'cafeteria' },
    { name: '과학실', en: 'science lab' },
  ],
};

export const DEFAULT_MATERIALS: Record<BuildingType, {
  floor: MaterialAssignment;
  wall: MaterialAssignment;
  baseboard: MaterialAssignment;
  ceiling: MaterialAssignment;
  door: MaterialAssignment;
}> = {
  apartment: {
    floor: { materialId: '', color: '#C9A96E', patternType: 'wood' },
    wall: { materialId: '', color: '#F5F3EF', patternType: 'solid' },
    baseboard: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    ceiling: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    door: { materialId: '', color: '#F0EBE3', patternType: 'solid' },
  },
  office: {
    floor: { materialId: '', color: '#8B8B8B', patternType: 'tile' },
    wall: { materialId: '', color: '#F5F5F5', patternType: 'solid' },
    baseboard: { materialId: '', color: '#E0E0E0', patternType: 'solid' },
    ceiling: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    door: { materialId: '', color: '#D0D0D0', patternType: 'solid' },
  },
  hospital: {
    floor: { materialId: '', color: '#E0DDD8', patternType: 'tile' },
    wall: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    baseboard: { materialId: '', color: '#E0E0E0', patternType: 'solid' },
    ceiling: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    door: { materialId: '', color: '#E8E8E8', patternType: 'solid' },
  },
  retail: {
    floor: { materialId: '', color: '#D5CEC3', patternType: 'tile' },
    wall: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    baseboard: { materialId: '', color: '#E0E0E0', patternType: 'solid' },
    ceiling: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    door: { materialId: '', color: '#E0E0E0', patternType: 'solid' },
  },
  school: {
    floor: { materialId: '', color: '#C9C0B0', patternType: 'tile' },
    wall: { materialId: '', color: '#F0F4EC', patternType: 'solid' },
    baseboard: { materialId: '', color: '#E0E0E0', patternType: 'solid' },
    ceiling: { materialId: '', color: '#FFFFFF', patternType: 'solid' },
    door: { materialId: '', color: '#D4C5A9', patternType: 'solid' },
  },
};

export const AI_CONTEXT: Record<BuildingType, string> = {
  apartment: 'This is a Korean residential apartment floor plan. Render with warm, cozy residential interior feel. Recessed ceiling lights, warm-toned LED lighting.',
  office: 'This is a commercial office floor plan with partitions and open spaces. Render with modern corporate interior, fluorescent ceiling panels, office furniture hints, clean professional look.',
  hospital: 'This is a medical clinic/hospital floor plan. Render with clinical, clean, sterile atmosphere. Bright fluorescent lighting, white walls, vinyl flooring, medical equipment hints.',
  retail: 'This is a retail store or cafe floor plan. Render with inviting commercial interior, track lighting or pendant lights, display areas, warm ambient atmosphere.',
  school: 'This is a school or academy floor plan. Render with educational institution interior, fluorescent panel lighting, durable materials, functional classroom layout.',
};

export function getRoomEnglish(name: string, buildingType: BuildingType): string {
  const preset = ROOM_PRESETS[buildingType].find((p) => p.name === name);
  return preset ? preset.en : name;
}
