'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Trash2, UserPlus } from 'lucide-react';

type Member = {
  id: string;
  role: string;
  status: string;
  user: { id: string; name: string | null; email: string | null };
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Propietario', ADMIN: 'Administrador', EDITOR: 'Editor',
  INSTRUCTOR: 'Instructor', SUPPORT: 'Soporte', VIEWER: 'Observador',
};

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800', ADMIN: 'bg-blue-100 text-blue-800',
  EDITOR: 'bg-green-100 text-green-800', INSTRUCTOR: 'bg-yellow-100 text-yellow-800',
  SUPPORT: 'bg-orange-100 text-orange-800', VIEWER: 'bg-gray-100 text-gray-800',
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchMembers(); }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) setMembers(await res.json());
    } catch { /* */ }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setInviting(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      setInviteEmail('');
      await fetchMembers();
    } catch { setError('Error al invitar'); }
    setInviting(false);
  }

  async function handleRemove(userId: string) {
    if (!confirm('¿Eliminar a este miembro del equipo?')) return;
    try {
      await fetch(`/api/admin/team?userId=${userId}`, { method: 'DELETE' });
      await fetchMembers();
    } catch { /* */ }
  }

  if (loading) return <div className="animate-spin h-6 w-6 border-2 border-[hsl(var(--brand-primary))] border-t-transparent rounded-full" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Equipo</h1>

      <form onSubmit={handleInvite} className="bg-white border rounded-xl p-4 mb-8 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="colaborador@email.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm">
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k} disabled={k === 'OWNER'}>{v}</option>)}
          </select>
        </div>
        <button type="submit" disabled={inviting}
          className="flex items-center gap-2 bg-[hsl(var(--brand-primary))] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          <UserPlus className="h-4 w-4" /> Invitar
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
              <div>
                <p className="font-medium">{m.user.name || m.user.email}</p>
                <p className="text-xs text-gray-400">{m.user.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role] || ''}`}>{ROLE_LABELS[m.role] || m.role}</span>
            </div>
            {m.role !== 'OWNER' && (
              <button onClick={() => handleRemove(m.user.id)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {members.length === 0 && <p className="text-gray-400 text-center py-8">No hay miembros en el equipo.</p>}
      </div>
    </div>
  );
}
