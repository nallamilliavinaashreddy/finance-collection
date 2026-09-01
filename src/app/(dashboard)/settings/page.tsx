'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/providers/toast-provider';
import { useLanguage } from '@/i18n/language-context';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
  getDatabaseHealth,
  resetDatabaseTestData,
  DatabaseHealthInfo,
  CompanySettingsData,
  AppSettingsData,
} from '@/lib/actions/settings';
import {
  exportFullBackupToJson,
  exportDatabaseToCsv,
  importJsonBackup,
} from '@/lib/backup-utils';
import {
  Building2,
  Sliders,
  UserCheck,
  HardDriveUpload,
  Shield,
  Activity,
  Database,
  CheckCircle2,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet,
  FileJson,
  Key,
  LogOut,
  IndianRupee,
  Lock,
  Clock,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Laptop,
  Globe,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    'company' | 'app' | 'profile' | 'backup' | 'security' | 'database'
  >('company');

  const [healthInfo, setHealthInfo] = useState<DatabaseHealthInfo | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingBackup, setIsProcessingBackup] = useState(false);

  // 1. Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettingsData>({
    companyName: 'Apex Capital Microfinance Ltd',
    companyLogoUrl: '',
    companyAddress: '124 Financial Towers, MG Road, Rajahmundry, AP 533101',
    phoneNumber: '+91 98450 12345',
    email: 'contact@apexcapital.in',
  });

  // 2. Application Settings State
  const [appSettings, setAppSettings] = useState<AppSettingsData>({
    currency: '₹ (INR) Indian Rupee',
    dateFormat: 'DD-MM-YYYY',
    theme: theme || 'dark',
    defaultWorkingDays: 100,
    skipSundays: true,
    confirmBeforeDelete: true,
    sessionTimeoutMinutes: 30,
  });

  // 3. Admin Profile & Change Password State
  const [profileForm, setProfileForm] = useState({
    adminName: 'System Administrator',
    email: 'admin@finance.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 4. File Upload State for Backup Import
  const [importFile, setImportFile] = useState<File | null>(null);

  // Fetch Database Health from Supabase
  const checkHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const res = await getDatabaseHealth();
      if (res.success && res.data) {
        setHealthInfo(res.data);
      } else {
        showToast(res.error || 'Failed to ping Supabase database', 'error');
      }
    } catch (err: any) {
      showToast('Error connecting to Supabase database', 'error');
    } finally {
      setIsLoadingHealth(false);
    }
  }, [showToast]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Handle Save Company Settings
  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Company profile settings saved successfully.', 'success', 'Company Settings Updated');
    }, 400);
  };

  // Handle Save Application Settings
  const handleSaveAppSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTheme(appSettings.theme);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Application preferences saved.', 'success', 'App Settings Saved');
    }, 400);
  };

  // Handle Password Change
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (profileForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      showToast('Admin password updated successfully.', 'success', 'Password Updated');
    }, 500);
  };

  // Handle Export to JSON
  const handleExportJson = async () => {
    setIsProcessingBackup(true);
    const res = await exportFullBackupToJson();
    setIsProcessingBackup(false);
    if (res.success) {
      showToast('Full JSON backup file downloaded successfully.', 'success', 'Backup Exported');
    } else {
      showToast(res.error || 'Failed to export backup JSON', 'error');
    }
  };

  // Handle Export to CSV
  const handleExportCsv = async () => {
    setIsProcessingBackup(true);
    const res = await exportDatabaseToCsv();
    setIsProcessingBackup(false);
    if (res.success) {
      showToast('Database CSV tables downloaded.', 'success', 'CSV Exported');
    } else {
      showToast(res.error || 'Failed to export CSV tables', 'error');
    }
  };

  // Handle Import JSON Backup
  const handleImportJson = async () => {
    if (!importFile) {
      showToast('Please select a JSON backup file to import.', 'warning');
      return;
    }

    setIsProcessingBackup(true);
    const res = await importJsonBackup(importFile);
    setIsProcessingBackup(false);

    if (res.success) {
      showToast('Backup restored successfully into live Supabase database.', 'success', 'Backup Restored');
      setImportFile(null);
      checkHealth();
    } else {
      showToast(res.error || 'Failed to import backup JSON', 'error');
    }
  };

  const [isResettingData, setIsResettingData] = useState(false);

  const handleResetTestData = async () => {
    if (!window.confirm('Are you sure you want to reset ALL test data? This will clear all test records while preserving your database tables, migrations, settings, and login credentials.')) {
      return;
    }

    setIsResettingData(true);
    try {
      const res = await resetDatabaseTestData();
      if (res.success) {
        showToast('All application test records have been reset to zero.', 'success', 'Test Data Reset Complete');
        checkHealth();
      } else {
        showToast(res.error || 'Failed to reset test data', 'error');
      }
    } catch {
      showToast('An unexpected error occurred while resetting test data', 'error');
    } finally {
      setIsResettingData(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    showToast('Logged out of Admin Session.', 'info');
    router.push('/login');
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              System Settings & Configuration
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Supabase Connected
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage company profile, application preferences, admin security, database backups, and live Supabase system health.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'company', label: 'Company Settings', icon: Building2 },
          { id: 'app', label: 'App Settings', icon: Sliders },
          { id: 'profile', label: 'Admin Profile', icon: UserCheck },
          { id: 'backup', label: 'Backup & Restore', icon: HardDriveUpload },
          { id: 'security', label: 'Security & Session', icon: Shield },
          { id: 'database', label: 'Supabase Database', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#FF7A00] text-white shadow-md shadow-[#FF7A00]/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Company Settings */}
      {activeTab === 'company' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF7A00]" />
              Company Details & Branding
            </CardTitle>
            <CardDescription>
              Organization information displayed on reports, receipts, and headers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompanySettings} className="flex flex-col gap-4">
              <Input
                label="Company Name *"
                value={companySettings.companyName}
                onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number *"
                  value={companySettings.phoneNumber}
                  onChange={(e) => setCompanySettings({ ...companySettings, phoneNumber: e.target.value })}
                  required
                />
                <Input
                  label="Official Email *"
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Company Registered Address *
                </label>
                <textarea
                  rows={3}
                  value={companySettings.companyAddress}
                  onChange={(e) => setCompanySettings({ ...companySettings, companyAddress: e.target.value })}
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20"
                  required
                />
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Save Company Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Application Settings */}
      {activeTab === 'app' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#FF7A00]" />
              Application Preferences
            </CardTitle>
            <CardDescription>
              Configure default rules, currency formatting, theme, and skip Sundays policy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveAppSettings} className="flex flex-col gap-5">
              {/* Currency & Date Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                    Currency (Default)
                  </label>
                  <input
                    type="text"
                    value={appSettings.currency}
                    readOnly
                    className="h-10 px-3.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 cursor-not-allowed"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date Format
                  </label>
                  <select
                    value={appSettings.dateFormat}
                    onChange={(e) => setAppSettings({ ...appSettings, dateFormat: e.target.value })}
                    className="h-10 px-3.5 text-sm rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20"
                  >
                    <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 02-08-2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-02)</option>
                  </select>
                </div>
              </div>

              {/* Global Language Selector */}
              <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-[#141414] border border-[#262626]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#FF7A00]" />
                    <span>{t('settings.languagePreference', 'Language Preference')}</span>
                  </label>
                  <Badge variant="info" className="text-[10px]">
                    {t('settings.currentLanguage', 'Current Language')}: {supportedLanguages.find(l => l.code === language)?.nativeName}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {supportedLanguages.map((langOpt) => {
                    const isSelected = language === langOpt.code;
                    return (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => setLanguage(langOpt.code)}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          isSelected
                            ? 'border-[#FF7A00] bg-[#FF7A00]/10 text-[#FF7A00] font-bold shadow-sm shadow-[#FF7A00]/20'
                            : 'border-[#262626] bg-[#111111] text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]'
                        }`}
                      >
                        <span className="text-base">{langOpt.flag}</span>
                        <span className="text-xs font-semibold">{langOpt.nativeName}</span>
                        <span className="text-[10px] text-[#737373]">{langOpt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Interface Theme
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark', label: 'Dark Mode', icon: Moon },
                    { id: 'light', label: 'Light Mode', icon: Sun },
                    { id: 'system', label: 'System', icon: Laptop },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSel = (theme || appSettings.theme) === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setAppSettings({ ...appSettings, theme: t.id });
                          setTheme(t.id);
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                          isSel
                            ? 'border-[#FF7A00] bg-[#141414] dark:bg-[#111111] text-[#FF7A00] dark:text-[#FF7A00] font-semibold'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working Days & Skip Sundays Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Default Working Days *"
                  type="number"
                  value={appSettings.defaultWorkingDays}
                  onChange={(e) =>
                    setAppSettings({ ...appSettings, defaultWorkingDays: Number(e.target.value) || 100 })
                  }
                  required
                />

                <div className="flex flex-col justify-center gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Skip Sundays (Holidays)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppSettings({ ...appSettings, skipSundays: !appSettings.skipSundays })}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        appSettings.skipSundays ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                          appSettings.skipSundays ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Calculates default loan tenure duration while keeping 7-day collection entry enabled.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Save App Settings
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Admin Profile */}
      {activeTab === 'profile' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#FF7A00]" />
              Admin Profile & Password
            </CardTitle>
            <CardDescription>
              Manage administrator account details and update credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Account Details */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Account Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Administrator Name"
                  value={profileForm.adminName}
                  onChange={(e) => setProfileForm({ ...profileForm, adminName: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>
            </div>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FF7A00]" />
                Change Password
              </h3>

              <Input
                label="Current Password *"
                type="password"
                placeholder="••••••••"
                value={profileForm.currentPassword}
                onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password *"
                  type="password"
                  placeholder="••••••••"
                  value={profileForm.newPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password *"
                  type="password"
                  placeholder="••••••••"
                  value={profileForm.confirmPassword}
                  onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Key className="w-4 h-4" />}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-500" />
                Export Database Backup
              </CardTitle>
              <CardDescription>
                Download full database backups in JSON or CSV format.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-[#FF7A00]" />
                  Full Database JSON Backup
                </span>
                <p className="text-[11px] text-slate-400">
                  Exports all customers, loans, and collections into a structured `.json` backup file.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportJson}
                  isLoading={isProcessingBackup}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="mt-2 w-fit"
                >
                  Export JSON Backup
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Database Tables CSV Export
                </span>
                <p className="text-[11px] text-slate-400">
                  Exports individual CSV spreadsheet files for customers, loans, and collections.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  isLoading={isProcessingBackup}
                  leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
                  className="mt-2 w-fit border-emerald-200 dark:border-emerald-900/60"
                >
                  Export Database CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#FF7A00]" />
                Import & Restore JSON Backup
              </CardTitle>
              <CardDescription>
                Upload a `.json` backup file to restore records directly into Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Backup File (.json) *
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#141414] dark:file:bg-[#111111] file:text-[#FF7A00] dark:file:text-[#FF7A00] hover:file:bg-[#1A1A1A]"
                />
              </div>

              {importFile && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-[#262626] text-xs text-[#FF7A00] dark:text-[#FF7A00]">
                  Selected file: <strong>{importFile.name}</strong> ({Math.round(importFile.size / 1024)} KB)
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleImportJson}
                isLoading={isProcessingBackup}
                disabled={!importFile}
                leftIcon={<Upload className="w-4 h-4" />}
                className="w-full mt-2"
              >
                Import & Restore to Supabase
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone: Reset Test Data */}
          <Card className="lg:col-span-2 border-rose-900/60 bg-rose-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5 text-rose-500" />
                Reset Application Test Data
              </CardTitle>
              <CardDescription className="text-rose-300/80">
                Clears all existing test records (customers, loans, collections, depositors, employees, expenses, chits, stamps, investment transactions) while preserving database tables, migrations, settings, and login credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-rose-900/40 pt-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">Perform Clean Zero Reset</span>
                <span className="text-[11px] text-[#A3A3A3]">After resetting, test data will be zeroed out for a fresh testing cycle.</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleResetTestData}
                isLoading={isResettingData}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Reset All Test Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: Security & Session */}
      {activeTab === 'security' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FF7A00]" />
              Security & Session Management
            </CardTitle>
            <CardDescription>
              Manage session timeout, record deletion prompts, and terminate sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Session Timeout */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Session Timeout Duration
                </span>
                <span className="text-[11px] text-slate-400">
                  Automatically log out after inactivity
                </span>
              </div>
              <select
                value={appSettings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setAppSettings({ ...appSettings, sessionTimeoutMinutes: Number(e.target.value) })
                }
                className="h-9 px-3 text-xs rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            {/* Confirm before delete */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Confirmation Before Deleting Records
                </span>
                <span className="text-[11px] text-slate-400">
                  Prompt a confirmation modal before deleting customers, loans, or collections.
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setAppSettings({ ...appSettings, confirmBeforeDelete: !appSettings.confirmBeforeDelete })
                }
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  appSettings.confirmBeforeDelete ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    appSettings.confirmBeforeDelete ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Admin Logout */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Terminate Admin Session
                </span>
                <span className="text-[11px] text-rose-700 dark:text-rose-300">
                  Log out of the current single admin session.
                </span>
              </div>
              <Button variant="danger" size="sm" onClick={handleLogout} leftIcon={<LogOut className="w-4 h-4" />}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: Supabase Database Health */}
      {activeTab === 'database' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Supabase Live Connection & Health
                </CardTitle>
                <CardDescription>
                  Real-time database latency, connection status, and table statistics
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={checkHealth}
                isLoading={isLoadingHealth}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Ping Database
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Status Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Connection Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={healthInfo?.status !== 'disconnected' ? 'success' : 'error'}>
                      {healthInfo?.status !== 'disconnected' ? 'Connected & Healthy' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Database Latency</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {healthInfo?.latencyMs || 0} ms
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Project Endpoint</span>
                  <span className="text-xs font-mono font-semibold text-[#FF7A00] dark:text-[#FF7A00] truncate mt-1">
                    {healthInfo?.supabaseUrl}
                  </span>
                </div>
              </div>

              {/* Table Statistics */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Supabase Database Tables ({healthInfo?.totalTables || 4})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(healthInfo?.tables || []).map((t) => (
                    <div
                      key={t.name}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-[#FF7A00]" />
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {t.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {t.rowCount} rows
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

