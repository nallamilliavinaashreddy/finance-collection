export interface NavItem {
  title: string;
  href: string;
  icon: string;
  translationKey: string;
  badge?: string;
}

export const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    translationKey: 'nav.dashboard',
  },
  {
    title: 'Investment Khata',
    href: '/investment-khata',
    icon: 'PiggyBank',
    translationKey: 'nav.investmentKhata',
  },
  {
    title: 'Day Book',
    href: '/day-book',
    icon: 'BookOpen',
    translationKey: 'nav.dayBook',
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: 'Users',
    translationKey: 'nav.customers',
  },
  {
    title: 'Loans',
    href: '/loans',
    icon: 'Landmark',
    translationKey: 'nav.loans',
  },
  {
    title: 'Collections',
    href: '/collections',
    icon: 'Receipt',
    translationKey: 'nav.collections',
  },
  {
    title: 'Interest',
    href: '/interest',
    icon: 'Percent',
    translationKey: 'nav.interest',
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: 'Wallet',
    translationKey: 'nav.expenses',
  },
  {
    title: 'Stamps',
    href: '/stamps',
    icon: 'FileSignature',
    translationKey: 'nav.stamps',
  },
  {
    title: 'Chits',
    href: '/chits',
    icon: 'Coins',
    translationKey: 'nav.chits',
  },
  {
    title: 'Depositors',
    href: '/depositors',
    icon: 'Landmark',
    translationKey: 'nav.depositors',
  },
  {
    title: 'Employees',
    href: '/employees',
    icon: 'Users',
    translationKey: 'nav.employees',
  },
  {
    title: 'Balance Sheet',
    href: '/balance-sheet',
    icon: 'Scale',
    translationKey: 'nav.balanceSheet',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: 'BarChart3',
    translationKey: 'nav.reports',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
    translationKey: 'nav.settings',
  },
];
