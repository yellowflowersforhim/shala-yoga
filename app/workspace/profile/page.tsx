'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({ displayName: '', title: '', bio: '', location: '', languages: [] as string[], portraitUrl: '', contactEmail: '', contactPhone: '', whatsappNumber: '', socialLinks: {} as Record<string, string>, instagram: '', facebook: '', youtube: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/workspace/profile').then(r => r.json()).then(d => {
      if (d && !d.error) setProfile(d);
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/workspace/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setMessage(res.ok ? 'Perfil guardado' : 'Error al guardar');
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Perfil del Instructor</h1>
      {message && <div className={`px-4 py-2 rounded-lg mb-4 text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Nombre público</span>
          <input type="text" value={profile.displayName} onChange={e => setProfile({ ...profile, displayName: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Tu nombre como instructor" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Título</span>
          <input type="text" value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Instructor de Hatha Yoga" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Biografía</span>
          <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={4}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Cuenta tu historia..." />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Ubicación</span>
          <input type="text" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Madrid, España" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Email de contacto</span>
            <input type="email" value={profile.contactEmail} onChange={e => setProfile({ ...profile, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Teléfono</span>
            <input type="text" value={profile.contactPhone} onChange={e => setProfile({ ...profile, contactPhone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">WhatsApp</span>
          <input type="text" value={profile.whatsappNumber} onChange={e => setProfile({ ...profile, whatsappNumber: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="+34123456789" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">URL de foto de perfil</span>
          <input type="url" value={profile.portraitUrl} onChange={e => setProfile({ ...profile, portraitUrl: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="https://..." />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Instagram</span>
            <input type="url" value={profile.instagram} onChange={e => setProfile({ ...profile, instagram: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="https://instagram.com/..." />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Facebook</span>
            <input type="url" value={profile.facebook} onChange={e => setProfile({ ...profile, facebook: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="https://facebook.com/..." />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">YouTube</span>
            <input type="url" value={profile.youtube} onChange={e => setProfile({ ...profile, youtube: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="https://youtube.com/@..." />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Sitio web</span>
            <input type="url" value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="https://..." />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium">Idiomas (separados por coma)</span>
          <input type="text" value={profile.languages.join(', ')} onChange={e => setProfile({ ...profile, languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="español, inglés" />
        </label>
        <button onClick={save} disabled={saving}
          className="bg-[hsl(var(--brand-primary))] text-white px-6 py-2 rounded-lg text-sm hover:opacity-90">Guardar perfil</button>
      </div>
    </div>
  );
}
