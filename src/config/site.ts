export const siteConfig = {
  name: 'FinCollect Admin',
  description: 'Production-ready Finance Collection & Loan Management Platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  admin: {
    name: 'Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@finance.com',
    role: 'Single Admin',
  },
};
