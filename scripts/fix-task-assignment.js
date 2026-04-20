// Script to rewrite TaskAssignment.tsx with correct UTF-8 encoding
const fs = require('fs');
const path = require('path');

const content = `'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, UserCheck, Users, Briefcase, ListTodo, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { formatAmountFa } from '@/utils/numberToWords';
import { toast } from 'sonner';

interface UserOption  { id: number; username: string; email: string | null; phone: string | null; }
interface RoleOption  { id: number; name: string; description: string | null; }
interface Employee    { id: number; user_id: number; position: string | null; username: string; phone: string | null; }
interface Task        { id: number; employee_id: number; role_description: string | null; attendance_hours: number | null; username: string; position: string | null; }
interface Assignment  { id: number; userId: number; roleId: number; baseFee: number | null; status: string; assignedAt: string; user: UserOption; role: RoleOption; }
interface Todo {
  id: number;
  title: string;
  description: string | null;
  status: 'pending' | 'done' | 'approved' | 'rejected';
  priority: number;
  penaltyPoints: number;
  adminNote: string | null;
  createdAt: string;
  assignment: { id: number; user: { id: number; username: string }; role: { id: number; name: string } };
}

interface Props { ceremonyId: number; ceremonyLabel: string; onClose: () => void; }

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40';

function toEnDigits(s: string): string {
  return s.replace(/[\u06f0-\u06f9]/g, (d) => String('\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9'.indexOf(d)))
          .replace(/[\u0660-\u0669]/g, (d) => String('\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669'.indexOf(d)));
}

const TODO_STATUS_STYLE: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  done:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};
const TODO_STATUS_FA: Record<string, string> = {
  pending: '\u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631', done: '\u0627\u0646\u062c\u0627\u0645 \u0634\u062f', approved: '\u062a\u0627\u06cc\u06cc\u062f \u0634\u062f', rejected: '\u0631\u062f \u0634\u062f',
};

export default function TaskAssignment({ ceremonyId, ceremonyLabel, onClose }: Props) {
  type Tab = 'assignments' | 'tasks' | 'todos';
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState({ employee_id: '', role_description: '', attendance_hours: '' });
  const [savingTask, setSavingTask] = useState(false);

  const [users, setUsers] = useState<UserOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignForm, setAssignForm] = useState({ userId: '', roleId: '', baseFee: '' });
  const [savingAssign, setSavingAssign] = useState(false);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [todoForm, setTodoForm] = useState({ assignmentId: '', title: '', description: '', priority: '1' });
  const [savingTodo, setSavingTodo] = useState(false);
  const [approveModal, setApproveModal] = useState<{ todo: Todo; action: 'approve' | 'reject' } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState('0');
  const [savingApprove, setSavingApprove] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/employees'),
      apiClient.get(\`/ceremonies/\${ceremonyId}\`),
      apiClient.get('/settings/roles'),
    ]).then(([empRes, cerRes, rolesRes]) => {
      setEmployees(empRes.data);
      setTasks(cerRes.data.tasks || []);
      setAssignments(cerRes.data.assignments || []);
      setRoles(rolesRes.data);
      setUsers(empRes.data.map((e: Employee) => ({ id: e.user_id, username: e.username, email: null, phone: e.phone })));
    }).catch(() => toast.error('\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc')).finally(() => setLoading(false));
  }, [ceremonyId]);

  const fetchTodos = useCallback(async () => {
    setTodosLoading(true);
    try {
      const res = await apiClient.get(\`/ceremonies/\${ceremonyId}/todos\`);
      setTodos(res.data);
    } catch { toast.error('\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0648\u0638\u0627\u06cc\u0641'); } finally { setTodosLoading(false); }
  }, [ceremonyId]);

  useEffect(() => {
    if (activeTab === 'todos') fetchTodos();
  }, [activeTab, fetchTodos]);

  async function addTask() {
    if (!taskForm.employee_id || !taskForm.role_description) return;
    setSavingTask(true);
    try {
      await apiClient.post(\`/ceremonies/\${ceremonyId}/tasks\`, {
        employee_id: parseInt(taskForm.employee_id),
        role_description: taskForm.role_description,
        attendance_hours: taskForm.attendance_hours
          ? (() => { const [h, m] = taskForm.attendance_hours.split(':').map(Number); return h + (m || 0) / 60; })()
          : 0,
      });
      const res = await apiClient.get(\`/ceremonies/\${ceremonyId}\`);
      setTasks(res.data.tasks || []);
      setTaskForm({ employee_id: '', role_description: '', attendance_hours: '' });
      toast.success('\u06a9\u0627\u0631\u0645\u0646\u062f \u0627\u0636\u0627\u0641\u0647 \u0634\u062f');
    } catch { toast.error('\u062e\u0637\u0627 \u062f\u0631 \u0627\u0641\u0632\u0648\u062f\u0646 \u06a9\u0627\u0631\u0645\u0646\u062f'); } finally { setSavingTask(false); }
  }

  async function removeTask(taskId: number) {
    try {
      await apiClient.delete(\`/ceremonies/\${ceremonyId}/tasks/\${taskId}\`);
      setTasks((t) => t.filter((x) => x.id !== taskId));
      toast.success('\u062d\u0630\u0641 \u0634\u062f');
    } catch { toast.error('\u062e\u0637\u0627 \u062f\u0631 \u062d\u0630\u0641'); }
  }

  async function addAssignment() {
    if (!assignForm.userId || !assignForm.roleId) return;
    setSavingAssign(true);
    try {
      const res = await apiClient.post(\`/ceremonies/\${ceremonyId}/assignments\`, {
        userId: parseInt(assignForm.userId),
        roleId: parseInt(assignForm.roleId),
        baseFee: assignForm.baseFee ? parseFloat(toEnDigits(assignForm.baseFee).replace(/[^0-9.]/g, '')) : null,
      });
      setAssignments((a) => [...a, res.data]);
      setAssignForm({ userId: '', roleId: '', baseFee: '' });
      toast.success('\u062a\u062e\u0635\u06cc\u0635 \u0646\u0642\u0634 \u0627\u0646\u062c\u0627\u0645 \u0634\u062f');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? '\u062e\u0637\u0627 \u062f\u0631 \u062a\u062e\u0635\u06cc\u0635 \u0646\u0642\u0634');
    } finally { setSavingAssign(false); }
  }

  async function removeAssignment(aId: number) {
    try {
      await apiClient.delete(\`/ceremonies/\${ceremonyId}/assignments/\${aId}\`);
      setAssignments((a) => a.filter((x) => x.id !== aId));
      toast.success('\u062a\u062e\u0635\u06cc\u0635 \u062d\u0630\u0641 \u0634\u062f');
    } catch { toast.error('\u062e\u0637\u0627 \u062f\u0631 \u062d\u0630\u0641'); }
  }

  async function addTodo() {
    if (!todoForm.assignmentId || !todoForm.title.trim()) return;
    setSavingTodo(true);
    try {
      await apiClient.post(\`/ceremonies/\${ceremonyId}/todos\`, {
        assignmentId: parseInt(todoForm.assignmentId),
        title: todoForm.title.trim(),
        description: todoForm.description.trim() || undefined,
        priority: parseInt(todoForm.priority) || 1,
      });
      setTodoForm((f) => ({ ...f, title: '', description: '', priority: '1' }));
      fetchTodos();
      toast.success('\u0648\u0638\u06cc\u0641\u0647 \u0627\u0636\u0627\u0641\u0647 \u0634\u062f');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? '\u062e\u0637\u0627 \u062f\u0631 \u0627\u0641\u0632\u0648\u062f\u0646 \u0648\u0638\u06cc\u0641\u0647');
    } finally { setSavingTodo(false); }
  }

  async function approveTodo(todo: Todo, action: 'approve' | 'reject') {
    setSavingApprove(true);
    try {
      const res = await apiClient.patch(\`/ceremonies/\${ceremonyId}/todos/\${todo.id}\`, {
        status: action === 'approve' ? 'approved' : 'rejected',
        adminNote: adminNote.trim() || undefined,
        penaltyPoints: action === 'reject' ? parseInt(penaltyPoints) || 0 : 0,
      });
      setTodos((ts) => ts.map((t) => t.id === todo.id ? res.data : t));
      setApproveModal(null);
      setAdminNote('');
      setPenaltyPoints('0');
      toast.success(action === 'approve' ? '\u062a\u0648\u062f\u0648 \u062a\u0627\u06cc\u06cc\u062f \u0634\u062f' : '\u062a\u0648\u062f\u0648 \u0631\u062f \u0634\u062f');
    } catch { toast.error('\u062e\u0637\u0627'); } finally { setSavingApprove(false); }
  }

  const assignColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  const assignLabel: Record<string, string> = { active: '\u0641\u0639\u0627\u0644', inactive: '\u063a\u06cc\u0631\u0641\u0639\u0627\u0644', cancelled: '\u0644\u063a\u0648' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold dark:text-white">\u0645\u062f\u06cc\u0631\u06cc\u062a \u062a\u06cc\u0645 \u0645\u0631\u0627\u0633\u0645</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{ceremonyLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {([
            { k: 'assignments', l: '\u0646\u0642\u0634\u200c\u0647\u0627', icon: Briefcase, count: assignments.length },
            { k: 'todos',       l: '\u0648\u0638\u0627\u06cc\u0641', icon: ListTodo,  count: todos.length },
            { k: 'tasks',       l: '\u0642\u062f\u06cc\u0645\u06cc',  icon: Users,    count: tasks.length },
          ] as const).map(({ k, l, icon: Icon, count }) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={\`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors px-2 \${activeTab === k ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}\`}>
              <Icon className="w-4 h-4" />{l}
              {count > 0 && <span className={\`text-[10px] rounded-full w-4 h-4 flex items-center justify-center \${activeTab === k ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}\`}>{count}</span>}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
          ) : (
            <>
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  {assignments.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">\u062a\u062e\u0635\u06cc\u0635\u200c\u0647\u0627\u06cc \u0641\u0639\u0627\u0644</h3>
                      {assignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-3 min-w-0">
                            <UserCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium dark:text-white truncate">{a.user.username}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{a.role.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {a.baseFee != null && a.baseFee > 0 && (
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{formatAmountFa(a.baseFee)} \u062a</span>
                            )}
                            <span className={\`text-[10px] px-1.5 py-0.5 rounded-full \${assignColors[a.status] ?? ''}\`}>{assignLabel[a.status] ?? a.status}</span>
                            <button onClick={() => removeAssignment(a.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">\u062a\u062e\u0635\u06cc\u0635 \u062c\u062f\u06cc\u062f</h3>
                    <select value={assignForm.userId} onChange={(e) => setAssignForm((f) => ({ ...f, userId: e.target.value }))} className={INPUT}>
                      <option value="">\u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0627\u0631\u0628\u0631...</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                    <select value={assignForm.roleId} onChange={(e) => setAssignForm((f) => ({ ...f, roleId: e.target.value }))} className={INPUT}>
                      <option value="">\u0627\u0646\u062a\u062e\u0627\u0628 \u0646\u0642\u0634...</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}{r.description ? \` \u2014 \${r.description}\` : ''}</option>)}
                    </select>
                    <input type="text" inputMode="numeric" placeholder="\u062f\u0633\u062a\u0645\u0632\u062f \u067e\u0627\u06cc\u0647 (\u062a\u0648\u0645\u0627\u0646) \u2014 \u0627\u062e\u062a\u06cc\u0627\u0631\u06cc"
                      value={assignForm.baseFee} onChange={(e) => setAssignForm((f) => ({ ...f, baseFee: e.target.value }))} className={INPUT} />
                    <button onClick={addAssignment} disabled={savingAssign || !assignForm.userId || !assignForm.roleId}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors">
                      {savingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {savingAssign ? '\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...' : '\u062a\u062e\u0635\u06cc\u0635 \u0646\u0642\u0634'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'todos' && (
                <div className="space-y-4">
                  {todosLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-purple-500" /></div>
                  ) : todos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">\u0647\u06cc\u0686 \u0648\u0638\u06cc\u0641\u0647\u200c\u0627\u06cc \u062a\u0639\u0631\u06cc\u0641 \u0646\u0634\u062f\u0647</div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">\u0648\u0638\u0627\u06cc\u0641 ({todos.length})</h3>
                      {todos.map((todo) => (
                        <div key={todo.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium dark:text-white">{todo.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {todo.assignment.user.username} \u2014 {todo.assignment.role.name}
                              </p>
                              {todo.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{todo.description}</p>}
                              {todo.adminNote && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />{todo.adminNote}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className={\`text-[10px] px-1.5 py-0.5 rounded-full \${TODO_STATUS_STYLE[todo.status]}\`}>
                                {TODO_STATUS_FA[todo.status]}
                              </span>
                              {todo.penaltyPoints > 0 && (
                                <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-1.5 py-0.5 rounded-full">
                                  -{todo.penaltyPoints} \u0627\u0645\u062a\u06cc\u0627\u0632
                                </span>
                              )}
                            </div>
                          </div>
                          {todo.status === 'done' && (
                            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                              <button onClick={() => { setApproveModal({ todo, action: 'approve' }); setAdminNote(''); setPenaltyPoints('0'); }}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs hover:bg-green-100 transition">
                                <CheckCircle2 className="w-3.5 h-3.5" />\u062a\u0627\u06cc\u06cc\u062f
                              </button>
                              <button onClick={() => { setApproveModal({ todo, action: 'reject' }); setAdminNote(''); setPenaltyPoints('0'); }}
                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-xs hover:bg-red-100 transition">
                                <XCircle className="w-3.5 h-3.5" />\u0631\u062f
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {assignments.length > 0 ? (
                    <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">\u0648\u0638\u06cc\u0641\u0647 \u062c\u062f\u06cc\u062f</h3>
                      <select value={todoForm.assignmentId} onChange={(e) => setTodoForm((f) => ({ ...f, assignmentId: e.target.value }))} className={INPUT}>
                        <option value="">\u0627\u0646\u062a\u062e\u0627\u0628 \u0639\u0636\u0648 \u062a\u06cc\u0645...</option>
                        {assignments.map((a) => (
                          <option key={a.id} value={a.id}>{a.user.username} \u2014 {a.role.name}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="\u0639\u0646\u0648\u0627\u0646 \u0648\u0638\u06cc\u0641\u0647 *"
                        value={todoForm.title} onChange={(e) => setTodoForm((f) => ({ ...f, title: e.target.value }))} className={INPUT} />
                      <textarea rows={2} placeholder="\u062a\u0648\u0636\u06cc\u062d\u0627\u062a (\u0627\u062e\u062a\u06cc\u0627\u0631\u06cc)"
                        value={todoForm.description} onChange={(e) => setTodoForm((f) => ({ ...f, description: e.target.value }))}
                        className={INPUT + ' resize-none'} />
                      <select value={todoForm.priority} onChange={(e) => setTodoForm((f) => ({ ...f, priority: e.target.value }))} className={INPUT}>
                        <option value="1">\u0627\u0648\u0644\u0648\u06cc\u062a \u0639\u0627\u062f\u06cc</option>
                        <option value="2">\u0627\u0648\u0644\u0648\u06cc\u062a \u0645\u062a\u0648\u0633\u0637</option>
                        <option value="3">\u0627\u0648\u0644\u0648\u06cc\u062a \u0628\u0627\u0644\u0627</option>
                        <option value="4">\u0627\u0648\u0644\u0648\u06cc\u062a \u0641\u0648\u0631\u06cc</option>
                        <option value="5">\u0627\u0648\u0644\u0648\u06cc\u062a \u0628\u062d\u0631\u0627\u0646\u06cc</option>
                      </select>
                      <button onClick={addTodo} disabled={savingTodo || !todoForm.assignmentId || !todoForm.title.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors">
                        {savingTodo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {savingTodo ? '\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...' : '\u0627\u0641\u0632\u0648\u062f\u0646 \u0648\u0638\u06cc\u0641\u0647'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-400">\u0627\u0628\u062a\u062f\u0627 \u062f\u0631 \u062a\u0628 \u00ab\u0646\u0642\u0634\u200c\u0647\u0627\u00bb \u0627\u0639\u0636\u0627 \u0631\u0627 \u0627\u062e\u062a\u0635\u0627\u0635 \u062f\u0647\u06cc\u062f</div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  {tasks.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">\u06a9\u0627\u0631\u0645\u0646\u062f\u0627\u0646 \u0627\u062e\u062a\u0635\u0627\u0635\u06cc</h3>
                      {tasks.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-3">
                            <UserCheck className="w-4 h-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium dark:text-white">{t.username}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{t.role_description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {(t.attendance_hours ?? 0) > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{t.attendance_hours} \u0633\u0627\u0639\u062a
                              </span>
                            )}
                            <button onClick={() => removeTask(t.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">\u0627\u0641\u0632\u0648\u062f\u0646 \u06a9\u0627\u0631\u0645\u0646\u062f</h3>
                    <select value={taskForm.employee_id} onChange={(e) => setTaskForm((f) => ({ ...f, employee_id: e.target.value }))} className={INPUT}>
                      <option value="">\u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0627\u0631\u0645\u0646\u062f...</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.username} \u2014 {e.position}</option>)}
                    </select>
                    <input type="text" placeholder="\u0634\u0631\u062d \u0648\u0638\u06cc\u0641\u0647" value={taskForm.role_description}
                      onChange={(e) => setTaskForm((f) => ({ ...f, role_description: e.target.value }))} className={INPUT} />
                    <input type="time" value={taskForm.attendance_hours}
                      onChange={(e) => setTaskForm((f) => ({ ...f, attendance_hours: e.target.value }))} className={INPUT} />
                    <button onClick={addTask} disabled={savingTask || !taskForm.employee_id || !taskForm.role_description}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors">
                      {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      {savingTask ? '\u062f\u0631 \u062d\u0627\u0644 \u0630\u062e\u06cc\u0631\u0647...' : '\u0627\u0641\u0632\u0648\u062f\u0646 \u0628\u0647 \u0645\u0631\u0627\u0633\u0645'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {approveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setApproveModal(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              {approveModal.action === 'approve'
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <XCircle className="w-5 h-5 text-red-500" />}
              <h3 className="font-bold dark:text-white">
                {approveModal.action === 'approve' ? '\u062a\u0627\u06cc\u06cc\u062f \u0648\u0638\u06cc\u0641\u0647' : '\u0631\u062f \u0648\u0638\u06cc\u0641\u0647'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              \u00ab{approveModal.todo.title}\u00bb \u2014 {approveModal.todo.assignment.user.username}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">\u06cc\u0627\u062f\u062f\u0627\u0634\u062a \u0645\u062f\u06cc\u0631 (\u0627\u062e\u062a\u06cc\u0627\u0631\u06cc)</label>
                <textarea rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="\u062a\u0648\u0636\u06cc\u062d \u0628\u0631\u0627\u06cc \u06a9\u0627\u0631\u0628\u0631..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none" />
              </div>
              {approveModal.action === 'reject' && (
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">\u0627\u0645\u062a\u06cc\u0627\u0632 \u0645\u0646\u0641\u06cc</label>
                  <input type="number" min="0" max="100" value={penaltyPoints}
                    onChange={(e) => setPenaltyPoints(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/40" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => approveTodo(approveModal.todo, approveModal.action)} disabled={savingApprove}
                className={\`flex-1 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition \${approveModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}\`}>
                {savingApprove && <Loader2 className="w-4 h-4 animate-spin" />}
                {approveModal.action === 'approve' ? '\u062a\u0627\u06cc\u06cc\u062f' : '\u0631\u062f'}
              </button>
              <button onClick={() => setApproveModal(null)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                \u0627\u0646\u0635\u0631\u0627\u0641
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const outPath = path.join(__dirname, '..', 'components', 'admin', 'TaskAssignment.tsx');
fs.writeFileSync(outPath, content, 'utf8');
console.log('Written:', outPath, '(' + Buffer.byteLength(content, 'utf8') + ' bytes)');
