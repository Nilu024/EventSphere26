import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const MAX_MB = 5;
/** Validates type/size client-side, then hands the File to `onUpload` (which posts to the backend – no Cloudinary keys here). */
export function ImageUpload({ onUpload, loading, label = 'Upload image' }) {
  const ref = useRef(null);
  const [name, setName] = useState('');
  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return toast.error('Please choose a PNG, JPG, WEBP or GIF image.');
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Image must be smaller than ${MAX_MB} MB.`);
    setName(file.name);
    onUpload(file);
  };
  return (
    <div className="flex items-center gap-3">
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={onPick} aria-label={label} />
      <Button variant="outline" size="sm" loading={loading} onClick={() => ref.current?.click()}><ImagePlus className="h-4 w-4" />{label}</Button>
      {name && <span className="truncate text-xs text-muted">{name}</span>}
    </div>
  );
}
