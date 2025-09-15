"use client"

import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Shield, UserPlus, Trash2, Ban, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type UserRow = {
  id: string;
  username: string;
  role: "admin" | "staff";
  active: boolean;
  created_at: string;
};

const fetcher = async (): Promise<UserRow[]> => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, role, active, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("Error fetching users:", error);
    return [];
  }
  return data ?? [];
};

function UsersSkeleton() {
  return (
    <Card className="rounded-2xl border border-gray-200">
      <CardContent className="p-6">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const { data, error, isLoading, mutate } = useSWR("users:list", fetcher, { refreshInterval: 10000 });

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);

  const meId = typeof document !== "undefined" ? (document.cookie.match(/uid=([^;]+)/)?.[1] ?? "") : "";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(u => !q || u.username.toLowerCase().includes(q));
  }, [data, search]);

  async function addUser() {
    if (!newUsername || !newPassword) {
      toast.error("Username and password are required");
      return;
    }
    try {
      setAdding(true);
      const { error } = await supabase
        .from("users")
        .insert([{ username: newUsername.trim(), password: newPassword, role: newRole }]);
      if (error) {
        toast.error("Failed to create user: " + error.message);
      } else {
        toast.success("Staff created successfully");
        setNewUsername("");
        setNewPassword("");
        setNewRole("staff");
        mutate();
      }
    } finally {
      setAdding(false);
    }
  }

  async function toggleActive(user: UserRow) {
    if (user.id === meId) return toast.error("You cannot block yourself");
    try {
      setBusyId(user.id);
      const { error } = await supabase
        .from("users")
        .update({ active: !user.active })
        .eq("id", user.id);
      if (error) toast.error(error.message); else { toast.success("Updated"); mutate(); }
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: UserRow) {
    if (user.id === meId) return toast.error("You cannot delete yourself");
    const confirmed = confirm(`Delete user ${user.username}?`);
    if (!confirmed) return;
    try {
      setBusyId(user.id);
      const { error } = await supabase.from("users").delete().eq("id", user.id);
      if (error) toast.error(error.message); else { toast.success("User deleted"); mutate(); }
    } finally {
      setBusyId(null);
    }
  }

  async function updateRole(user: UserRow, role: "admin" | "staff") {
    if (user.id === meId && role !== "admin") return toast.error("You cannot demote yourself");
    try {
      setRoleBusyId(user.id);
      const { error } = await supabase.from("users").update({ role }).eq("id", user.id);
      if (error) toast.error(error.message); else { toast.success("Role updated"); mutate(); }
    } finally {
      setRoleBusyId(null);
    }
  }

  if (isLoading) return <UsersSkeleton />;
  if (error) return <div className="text-sm text-destructive">Failed to load users.</div>;

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100">
        <div className="max-w-md mx-auto lg:max-w-7xl lg:px-8 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-white">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Users</h1>
                <p className="text-sm text-gray-600">Manage staff and admins</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto lg:max-w-7xl lg:px-8 p-6 space-y-6">
        {/* Add Staff */}
        <Card className="rounded-2xl border border-gray-200">
          <CardContent className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Input placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex gap-2">
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "staff")}>
                <SelectTrigger className="rounded-xl w-full">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={addUser} disabled={adding} className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                {adding ? <Loader2 className="size-4 mr-2 animate-spin" /> : <UserPlus className="size-4 mr-2" />}Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="rounded-2xl border border-gray-200">
          <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input placeholder="Search username" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl h-10" />
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Total: {filtered.length}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Desktop table */}
        <div className="hidden lg:block">
          <Card className="rounded-2xl border border-gray-200">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} className="hover:bg-orange-50/40">
                      <TableCell className="font-medium text-gray-900">{u.username}</TableCell>
                      <TableCell>
                        <Select defaultValue={u.role} onValueChange={(v) => updateRole(u, v as "admin" | "staff")}>
                          <SelectTrigger className="rounded-xl h-9 w-32" disabled={roleBusyId === u.id}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3 text-green-600" /> Active</Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Blocked</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => toggleActive(u)} variant="outline" className="rounded-xl" disabled={busyId === u.id}>
                            {busyId === u.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : u.active ? (
                              <><Ban className="size-4 mr-1" /> Block</>
                            ) : (
                              <><Shield className="size-4 mr-1" /> Unblock</>
                            )}
                          </Button>
                          <Button onClick={() => deleteUser(u)} variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" disabled={busyId === u.id}>
                            {busyId === u.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Mobile list */}
        <div className="lg:hidden space-y-3">
          {filtered.map((u) => (
            <Card key={u.id} className="rounded-2xl border border-gray-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{u.username}</div>
                    <div className="text-xs text-gray-600">{new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <div>
                    {u.active ? (
                      <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3 text-green-600" /> Active</Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Blocked</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Select defaultValue={u.role} onValueChange={(v) => updateRole(u, v as "admin" | "staff")}>
                    <SelectTrigger className="rounded-xl h-9 w-32" disabled={roleBusyId === u.id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={() => toggleActive(u)} variant="outline" className="rounded-xl" disabled={busyId === u.id}>
                      {busyId === u.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : u.active ? (
                        <><Ban className="size-4 mr-1" /> Block</>
                      ) : (
                        <><Shield className="size-4 mr-1" /> Unblock</>
                      )}
                    </Button>
                    <Button onClick={() => deleteUser(u)} variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" disabled={busyId === u.id}>
                      {busyId === u.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


