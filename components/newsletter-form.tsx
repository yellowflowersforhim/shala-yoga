
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || null })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setEmail('');
        setName('');
      } else {
        toast.error(data.error || 'Error al suscribirte');
      }
    } catch (error) {
      console.error('Error al suscribirse:', error);
      toast.error('Error al procesar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Input
          type="email"
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="bg-white"
        />
      </div>
      <div>
        <Input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          className="bg-white"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary-dark))]"
      >
        <Mail className="w-4 h-4 mr-2" />
        {loading ? 'Suscribiendo...' : 'Suscribirse'}
      </Button>
      <p className="text-xs text-gray-400">
        Recibirás novedades sobre programas y eventos de yoga
      </p>
    </form>
  );
}
