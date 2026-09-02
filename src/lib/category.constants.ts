import {
  Wallet, Briefcase, DollarSign, PiggyBank, TrendingUp, Gift,
  Home, Zap, ShoppingCart, Utensils, Plane, ShoppingBag,
  Heart, Dumbbell, Car, Music, Coffee, Phone,
  Shirt, BookOpen, Users, Wrench, Bus, Receipt,
  type LucideIcon,
} from 'lucide-react'

export const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#10b981', '#06b6d4', '#3b82f6',
  '#8b5cf6', '#ec4899', '#64748b', '#78716c',
]

export interface IconEntry {
  name: string
  component: LucideIcon
}

export const CATEGORY_ICONS: IconEntry[] = [
  { name: 'Wallet', component: Wallet },
  { name: 'Briefcase', component: Briefcase },
  { name: 'DollarSign', component: DollarSign },
  { name: 'PiggyBank', component: PiggyBank },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Gift', component: Gift },
  { name: 'Home', component: Home },
  { name: 'Zap', component: Zap },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Utensils', component: Utensils },
  { name: 'Plane', component: Plane },
  { name: 'ShoppingBag', component: ShoppingBag },
  { name: 'Heart', component: Heart },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Car', component: Car },
  { name: 'Music', component: Music },
  { name: 'Coffee', component: Coffee },
  { name: 'Phone', component: Phone },
  { name: 'Shirt', component: Shirt },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Users', component: Users },
  { name: 'Wrench', component: Wrench },
  { name: 'Bus', component: Bus },
  { name: 'Receipt', component: Receipt },
]
