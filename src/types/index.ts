export type UserRole = 'admin' | 'manager' | 'collector';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  phoneNumber?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export type LoanType = 'daily' | 'weekly' | 'monthly' | 'adjustment';
export type LoanStatus = 'active' | 'closed' | 'settled';

export interface LoanSettlement {
  id: string;
  loanId: string;
  customerId?: string;
  settlementType: 'full' | 'custom';
  settlementDate: string;
  outstandingBeforeSettlement: number;
  amountPaid: number;
  waivedAmount: number;
  paymentMethod?: string;
  referenceNumber?: string;
  remarks?: string;
  settledBy?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  customerId: string;
  customerName: string;
  mobileNumber: string;
  address?: string;
  activeLoansCount?: number;
  totalLoansCount?: number;
  totalAmountGiven?: number;
  totalBalanceAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  mobileNumber?: string;
  loanType: LoanType;
  city?: string;
  amountGiven: number;
  totalCollectionAmount: number;
  interestRate?: number;
  workingDays: number;
  totalWeeks?: number;
  totalMonths?: number;
  dailyAmount: number;
  weeklyAmount?: number;
  monthlyAmount?: number;
  collectedAmount: number;
  balanceAmount: number;
  isClosed: boolean;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  createdAt?: string;
}

export interface Collection {
  id: string;
  receiptNumber?: string;
  loanId: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  amountPaid: number;
  paymentDate: string;
  remarks?: string;
  remainingBalanceAfterPayment: number;
  weekNumber?: number;
  weekStartDate?: string;
  createdAt?: string;
}

export type AdjustmentTransactionType = 'disbursement' | 'interest' | 'payment';

export interface AdjustmentLedgerItem {
  id: string;
  loanId: string;
  transactionDate: string;
  transactionType: AdjustmentTransactionType;
  openingBalance: number;
  interestRate?: number;
  interestAdded: number;
  paymentReceived: number;
  closingBalance: number;
  remarks?: string;
  createdAt?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeLoansCount: number;
  totalAmountGiven: number;
  totalCollectionTarget: number;
  totalCollectedAmount: number;
  remainingBalance: number;
  todaysCollections: number;
  expectedProfit?: number;
  profitCollected?: number;
  profitRemaining?: number;
}

export type ExpenseCategory =
  | 'Office'
  | 'Travel'
  | 'Salary'
  | 'Utilities'
  | 'Maintenance'
  | 'Marketing'
  | 'Misc';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Card';

export interface Expense {
  id: string;
  expenseDate: string;
  category: ExpenseCategory | string;
  amount: number;
  description: string;
  paidTo?: string;
  paymentMode: PaymentMode | string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseMetrics {
  todaysExpenses: number;
  thisMonthsExpenses: number;
  totalExpenses: number;
}

export type StampType =
  | 'Agreement Stamp'
  | 'Promissory Note'
  | 'Legal Affidavit'
  | 'e-Stamp'
  | 'Revenue Stamp'
  | 'Misc';

export interface Stamp {
  id: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  loanId?: string;
  stampDate: string;
  stampType: StampType | string;
  stampNumber?: string;
  amount: number;
  vendor?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StampMetrics {
  todaysStampIncome: number;
  thisMonthsStampIncome: number;
  totalStampIncome: number;
}

export type ChitStatus = 'active' | 'completed' | 'closed';
export type ChitResultStatus = 'profit' | 'loss' | 'break_even';

export interface Chit {
  id: string;
  chitCompany: string;
  groupNumber: string;
  chitValue: number;
  monthlyInstallment: number;
  totalMonths: number;
  paidMonths: number;
  remainingInstallments: number;
  totalPaid: number;
  prizeTaken: boolean;
  prizeAmount: number;
  prizeDate?: string;
  startDate: string;
  nextDueDate: string;
  status: ChitStatus;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
  // Accounting & Profit/Loss Integration Fields
  totalInvestment?: number;
  totalReceived?: number;
  principalRecovered?: number;
  netResult?: number;
  resultStatus?: ChitResultStatus;
  profitAmount?: number;
  lossAmount?: number;
}

export interface ChitPayment {
  id: string;
  chitId: string;
  chitCompany?: string;
  groupNumber?: string;
  paymentDate: string;
  amount: number;
  receiptNumber?: string;
  paymentMode: PaymentMode | string;
  remarks?: string;
  createdAt?: string;
}

export interface ChitMetrics {
  todaysChitPayments: number;
  thisMonthsChitPayments: number;
  totalChitValue: number;
  totalPaidAmount: number;
  activeChitsCount: number;
  totalPrizeReceived: number;
  totalChitProfit?: number;
  totalChitLoss?: number;
  netChitProfitLoss?: number;
}

export type InvestmentTransactionType =
  | 'Capital Added'
  | 'Loan Given'
  | 'Collection Received'
  | 'Expense'
  | 'Stamp Expense'
  | 'Stamp Income'
  | 'Chit Payment'
  | 'Chit Installment'
  | 'Chit Prize Received'
  | 'Chit Profit'
  | 'Chit Loss'
  | 'Deposit Received'
  | 'Business Withdrawal'
  | 'Withdrawal Return'
  | 'Daily Interest'
  | 'Annual Interest'
  | 'Capital Returned';

export interface InvestmentTransaction {
  id: string;
  transactionDate: string;
  transactionType: InvestmentTransactionType;
  openingBalance: number;
  amountIn: number;
  amountOut: number;
  interestRate: number;
  dailyInterestAdded: number;
  balance: number;
  closingBalance: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdAt?: string;
}

export interface BusinessWithdrawal {
  id: string;
  withdrawalDate: string;
  amount: number;
  interestPercentage: number;
  lastInterestCalculated: string;
  outstandingAmount: number;
  dailyInterestAmount?: number;
  accruedInterest?: number;
  remarks?: string;
  createdAt?: string;
}

export interface InvestmentMetrics {
  ownerCapital: number;
  currentBalance: number;
  totalWorkingCapital: number;
  investmentInterest: number;
  loanInterest: number;
  expenses: number;
  businessWithdrawals: number;
  netProfit: number;
  monthlyInterestRate: number;
  annualInterestRate?: number;
  interestType?: 'simple' | 'compound';
  totalCapitalAdded?: number;
  totalCapitalWithdrawn?: number;
  currentCapital?: number;
  accruedInterest?: number;
  totalInvestmentValue?: number;
}

export type DepositorStatus = 'active' | 'closed';

export interface Depositor {
  id: string;
  depositorName: string;
  mobileNumber?: string;
  address?: string;
  depositAmount: number;
  monthlyInterestRate: number;
  annualInterestRate?: number;
  interestType?: 'simple' | 'compound';
  depositDate: string;
  expectedReturnDate?: string;
  paymentMode: PaymentMode | string;
  outstandingPrincipal: number;
  totalInterestPaid: number;
  accruedInterest?: number;
  elapsedDays?: number;
  completedYears?: number;
  remainingDays?: number;
  compoundedBalance?: number;
  totalAccruedInterest?: number;
  unpaidAccruedInterest?: number;
  totalPayable?: number;
  status: DepositorStatus;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DepositorLedgerTransactionType =
  | 'deposit_received'
  | 'interest_paid'
  | 'partial_return'
  | 'full_return';

export interface DepositorLedger {
  id: string;
  depositorId: string;
  depositorName?: string;
  transactionDate: string;
  transactionType: DepositorLedgerTransactionType;
  openingBalance: number;
  amountIn: number;
  amountOut: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  remarks?: string;
  createdAt?: string;
}

export interface DepositorMetrics {
  totalDepositedAmount: number;
  activeDepositors: number;
  outstandingDepositBalance: number;
  totalAccruedInterest: number;
  totalPayableOutstanding: number;
  monthlyInterestPayable: number;
  totalInterestPaid: number;
  closedDeposits: number;
}

export type InterestType = 'daily' | 'weekly' | 'monthly' | 'adjustment';

export interface InterestTransaction {
  id: string;
  collectionId?: string;
  loanId: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  transactionDate: string;
  interestType: InterestType;
  interestAmount: number;
  remarks?: string;
  createdAt?: string;
}

export interface InterestMetrics {
  dailyInterest: number;
  weeklyInterest: number;
  monthlyInterest: number;
  adjustmentInterest: number;
  totalInterestCollected: number;
}

export interface InterestReportData {
  dailyInterest: number;
  weeklyInterest: number;
  monthlyInterest: number;
  adjustmentInterest: number;
  totalInterestCollected: number;
  interestReports: InterestTransaction[];
}

export type EmployeeStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  employeeName: string;
  mobileNumber?: string;
  address?: string;
  monthlySalary: number;
  status: EmployeeStatus;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeSalary {
  id: string;
  employeeId: string;
  employeeName?: string;
  salaryMonth: string;
  salaryAmount: number;
  bonus: number;
  deduction: number;
  netSalaryPaid: number;
  paymentDate: string;
  paymentMode: string;
  remarks?: string;
  createdAt?: string;
}

export interface EmployeeMetrics {
  totalEmployees: number;
  activeEmployees: number;
  monthlyPayrollCost: number;
  totalSalaryPaidYTD: number;
}


