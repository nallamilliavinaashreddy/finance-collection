'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Customer } from '@/types';
import { CustomerFormData } from '@/lib/validations/customer';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '@/lib/actions/customers';
import { CustomerModal } from '@/components/customers/customer-modal';
import { DeleteCustomerModal } from '@/components/customers/delete-customer-modal';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/toast-provider';
import { formatDate } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Phone,
  MapPin,
  UserCheck,
  UserPlus,
  Database,
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { showToast } = useToast();

  // Load Customers list directly from Supabase
  const fetchCustomers = useCallback(async (query: string = '') => {
    setIsLoading(true);
    try {
      const res = await getCustomers(query);
      if (res.success && res.data) {
        setCustomers(res.data);
      } else {
        showToast(res.error || 'Failed to query customers table in Supabase', 'error');
        setCustomers([]);
      }
    } catch (err: any) {
      showToast('Error connecting to Supabase customers table', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCustomers(searchQuery);
  }, [searchQuery, fetchCustomers]);

  // Handle Add / Edit Customer Form Submit to Supabase
  const handleFormSubmit = async (formData: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      if (selectedCustomer) {
        // Edit Customer in Supabase
        const res = await updateCustomer(selectedCustomer.id, formData);
        if (res.success && res.data) {
          showToast(`Customer "${formData.customerName}" updated in Supabase.`, 'success', 'Customer Updated');
          setIsFormModalOpen(false);
          setSelectedCustomer(null);
          fetchCustomers(searchQuery);
        } else {
          showToast(res.error || 'Failed to update customer in Supabase', 'error');
        }
      } else {
        // Add Customer to Supabase
        const res = await createCustomer(formData);
        if (res.success && res.data) {
          showToast(`Customer "${formData.customerName}" (ID: ${formData.customerId}) created in Supabase.`, 'success', 'Customer Created');
          setIsFormModalOpen(false);
          fetchCustomers(searchQuery);
        } else {
          showToast(res.error || 'Failed to insert customer into Supabase', 'error');
        }
      }
    } catch (err: any) {
      showToast('An unexpected error occurred during Supabase operation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete Customer in Supabase
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCustomer(customerToDelete.id);
      if (res.success) {
        showToast(`Customer "${customerToDelete.customerName}" deleted from Supabase.`, 'success', 'Customer Deleted');
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
        fetchCustomers(searchQuery);
      } else {
        showToast(res.error || 'Failed to delete customer from Supabase', 'error');
      }
    } catch (err: any) {
      showToast('An unexpected error occurred during Supabase deletion.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  // Table Columns Definition
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'customerId',
      header: 'Customer ID',
      cell: ({ row }) => (
        <Badge variant="info" className="font-mono text-xs font-semibold tracking-wide">
          {row.original.customerId}
        </Badge>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FF7A00]/10 text-[#FF7A00] dark:text-[#FF7A00] font-bold text-xs flex items-center justify-center shrink-0">
            {row.original.customerName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {row.original.customerName}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'mobileNumber',
      header: 'Mobile Number',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.original.mobileNumber}</span>
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
          {row.original.address ? (
            <>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{row.original.address}</span>
            </>
          ) : (
            <span className="italic opacity-60">No address specified</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered Date',
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">
          {formatDate(row.original.createdAt || new Date())}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row.original)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-[#FF7A00] dark:text-slate-400 dark:hover:text-[#FF7A00]"
            title="Edit Customer"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDelete(row.original)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
            title="Delete Customer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Customer Directory
            </h2>
            <Badge variant="success" className="gap-1 text-[10px]">
              <Database className="w-3 h-3 text-emerald-500" />
              Supabase Connected
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time Supabase PostgreSQL CRUD operations. Search by manual Customer ID or Name.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSelectedCustomer(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-md shadow-[#FF7A00]/20 shrink-0"
        >
          Add Customer
        </Button>
      </div>

      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Customers (Supabase)
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {customers.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] dark:text-[#FF7A00] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Database Rows
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {customers.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Search Matches
              </span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {customers.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FF7A00]/10 text-[#FF7A00] dark:text-[#FF7A00] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Customers Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle>Customer Accounts</CardTitle>
            <CardDescription>
              Search by customer_id or customer_name
            </CardDescription>
          </div>

          {/* Real-time Supabase Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer_id or name..."
                className="w-full h-10 pl-9 pr-4 text-xs rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/20 focus:border-[#FF7A00] transition-colors"
              />
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => fetchCustomers(searchQuery)}
              className="px-3"
              title="Refresh from Supabase"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <DataTable
            columns={columns}
            data={customers}
            emptyText={
              isLoading
                ? 'Querying Supabase database...'
                : searchQuery
                ? `No customers found in Supabase matching customer_id "${searchQuery}".`
                : 'No customer records in Supabase customers table. Click "Add Customer" to insert a record.'
            }
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        customer={selectedCustomer}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCustomerModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        customer={customerToDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}

