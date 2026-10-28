import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Shield, UserCheck, GraduationCap } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import type { User, UserRole } from '../../types/auth';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { formatDate } from '../../lib/utils';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User[]>({
    queryKey: ['users', search],
    queryFn: () => apiClient.get<User[]>(API_ENDPOINTS.users.list, { search: search.trim() || undefined }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      return apiClient.patch(API_ENDPOINTS.users.updateRole(id), { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-amber-600" />;
      case 'teacher':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'student':
      default:
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University User Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations and grant Faculty or System Administrator privileges
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {isLoading && <LoadingState type="list" count={4} />}

      {isError && (
        <ErrorState
          title="Directory Unavailable"
          message={error instanceof Error ? error.message : 'Unable to query user list from the backend.'}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && users.length === 0 && (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-400" />}
          title="No Users Found"
          description="No registered user accounts match the provided search criteria."
        />
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        {getRoleIcon(u.role)}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={u.role === 'admin' ? 'amber' : u.role === 'teacher' ? 'emerald' : 'indigo'}
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({
                            id: u.id,
                            role: e.target.value as UserRole,
                          })
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
