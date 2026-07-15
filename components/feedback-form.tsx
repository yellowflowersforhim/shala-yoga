
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeedbackFormProps {
  cohortId?: string;
  enrollmentId?: string;
  onSuccess?: () => void;
}

export default function FeedbackForm({
  cohortId,
  enrollmentId,
  onSuccess,
}: FeedbackFormProps) {
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rating,
          cohortId,
          enrollmentId,
        }),
      });

      if (!response.ok) throw new Error('Error al enviar feedback');

      toast.success('¡Gracias por tu feedback!');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        category: 'general',
        message: '',
      });
      setRating(0);

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error al enviar el feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Comparte tu Experiencia</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Calificación *</Label>
          <div className="flex space-x-2 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="name">Nombre *</Label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          />
        </div>

        <div>
          <Label htmlFor="category">Categoría</Label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
          >
            <option value="general">General</option>
            <option value="instructor">Instructor</option>
            <option value="content">Contenido</option>
            <option value="platform">Plataforma</option>
          </select>
        </div>

        <div>
          <Label htmlFor="message">Tu Experiencia *</Label>
          <textarea
            id="message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-primary))]"
            placeholder="Cuéntanos sobre tu experiencia..."
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Enviando...' : 'Enviar Feedback'}
        </Button>
      </form>
    </Card>
  );
}
