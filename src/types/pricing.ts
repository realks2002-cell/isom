export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  render_limit: number;
  project_limit: number;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
