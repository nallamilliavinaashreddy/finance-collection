import { UserRole } from '@/types';

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  translationKey: string;
  badge?: string;
  allowedRoles?: UserRole[];
}

export const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    translationKey: 'nav.dashboard',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Investment Khata',
    href: '/investment-khata',
    icon: 'PiggyBank',
    translationKey: 'nav.investmentKhata',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Day Book',
    href: '/day-book',
    icon: 'BookOpen',
    translationKey: 'nav.dayBook',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: 'Users',
    translationKey: 'nav.customers',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Loans',
    href: '/loans',
    icon: 'Landmark',
    translationKey: 'nav.loans',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Collections',
    href: '/collections',
    icon: 'Receipt',
    translationKey: 'nav.collections',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Interest',
    href: '/interest',
    icon: 'Percent',
    translationKey: 'nav.interest',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: 'Wallet',
    translationKey: 'nav.expenses',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Stamps',
    href: '/stamps',
    icon: 'FileSignature',
    translationKey: 'nav.stamps',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Chits',
    href: '/chits',
    icon: 'Coins',
    translationKey: 'nav.chits',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Depositors',
    href: '/depositors',
    icon: 'Landmark',
    translationKey: 'nav.depositors',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: 'Users',
    translationKey: 'nav.employees',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Balance Sheet',
    href: '/balance-sheet',
    icon: 'Scale',
    translationKey: 'nav.balanceSheet',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
    translationKey: 'nav.reports',
    allowedRoles: ['admin', 'manager', 'collector', 'employee'],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
    translationKey: 'nav.settings',
    allowedRoles: ['admin'],
  },
];
