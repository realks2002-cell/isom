export interface PortfolioItem {
  id: string;
  title: string;
  subtitle: string | null;
  status: 'active' | 'draft';
  thumbnail_url: string | null;
  layer_count: number;
  tags: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
