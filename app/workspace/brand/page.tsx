'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const FONTS = ['inter', 'geist', 'system-ui', 'serif', 'mono'];

export default function BrandPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState({ primaryColor: '#0f766e', secondaryColor: '#14b8a6', accentColor: '#f59e0b', headingFont: 'inter', bodyFont: 'inter', buttonStyle: 'rounded', logoUrl: '' });
  const [settings, setSettings] = useState({ siteTitle: '', siteDescription: '', heroHeadline: '', heroSubheadline: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/workspace/brand').then(r => r.json()).then(d => {
      if (d.theme) setTheme(d.theme);
      if (d.settings) setSettings(d.settings);
    }).catch(() => {});
  }, []);

  async function saveTheme() {
    setSaving(true);
    const res = await fetch('/api/workspace/brand', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(theme) });
    if (res.ok) setMessage('Marca actualizada');
    setSaving(false);
  }

  async function saveSettings() {
    setSaving(true);
    const res = await fetch('/api/workspace/brand/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    if (res.ok) setMessage('Configuración guardada');
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Marca y Sitio</h1>
      {message && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>}

      <div className="bg-white border rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Colores y tipografía</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="text-sm">Color principal</span>
            <input type="color" value={theme.primaryColor} onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
              className="w-full h-10 rounded border mt-1" />
          </label>
          <label className="block">
            <span className="text-sm">Color secundario</span>
            <input type="color" value={theme.secondaryColor} onChange={e => setTheme({ ...theme, secondaryColor: e.target.value })}
              className="w-full h-10 rounded border mt-1" />
          </label>
          <label className="block">
            <span className="text-sm">Color acento</span>
            <input type="color" value={theme.accentColor} onChange={e => setTheme({ ...theme, accentColor: e.target.value })}
              className="w-full h-10 rounded border mt-1" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-sm">Tipografía títulos</span>
            <select value={theme.headingFont} onChange={e => setTheme({ ...theme, headingFont: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm">Tipografía cuerpo</span>
            <select value={theme.bodyFont} onChange={e => setTheme({ ...theme, bodyFont: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm">
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
        </div>
        <button onClick={saveTheme} disabled={saving}
          className="bg-[hsl(var(--brand-primary))] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">Guardar tema</button>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <label className="block">
            <span className="text-sm">Estilo de botones</span>
            <select value={theme.buttonStyle} onChange={e => setTheme({ ...theme, buttonStyle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm">
              <option value="rounded">Redondeado</option>
              <option value="pill">Píldora</option>
              <option value="square">Cuadrado</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm">URL del logo</span>
            <input type="url" value={theme.logoUrl} onChange={e => setTheme({ ...theme, logoUrl: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="https://..." />
          </label>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-semibold mb-4">Información del sitio</h2>
        <div className="space-y-4 mb-4">
          <label className="block">
            <span className="text-sm">Título del sitio</span>
            <input type="text" value={settings.siteTitle} onChange={e => setSettings({ ...settings, siteTitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Mi Escuela de Yoga" />
          </label>
          <label className="block">
            <span className="text-sm">Descripción</span>
            <input type="text" value={settings.siteDescription} onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Hatha Yoga en Barcelona" />
          </label>
          <label className="block">
            <span className="text-sm">Titular principal (hero)</span>
            <input type="text" value={settings.heroHeadline} onChange={e => setSettings({ ...settings, heroHeadline: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Encuentra tu equilibrio interior" />
          </label>
          <label className="block">
            <span className="text-sm">Subtitular (hero)</span>
            <input type="text" value={settings.heroSubheadline} onChange={e => setSettings({ ...settings, heroSubheadline: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg mt-1 text-sm" placeholder="Programas intensivos y clases semanales" />
          </label>
        </div>
        <button onClick={saveSettings} disabled={saving}
          className="bg-[hsl(var(--brand-primary))] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">Guardar configuración</button>
      </div>
    </div>
  );
}
