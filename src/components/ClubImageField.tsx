import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClubImageField({ id, imageUrl, file, onUrlChange, onFileChange, disabled }: {
  id: string; imageUrl: string; file: File | null; onUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void; disabled: boolean;
}) {
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="space-y-3">
    <Label htmlFor={id}>Bild (valfritt)</Label>
    <div className="flex flex-wrap items-center gap-3">
      <ImagePlus className="h-5 w-5 text-gold" aria-hidden="true" />
      <Input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled} className="max-w-sm" onChange={e => { onFileChange(e.target.files?.[0] ?? null); e.target.value = ''; }} />
    </div>
    {(preview || imageUrl) && <div className="flex items-start gap-3">
      <img src={preview || imageUrl} alt="Vald bild" className="h-32 w-32 rounded-md bg-muted object-contain" />
      <Button type="button" size="icon" variant="outline" aria-label="Ta bort bild" title="Ta bort bild" disabled={disabled} onClick={() => { onFileChange(null); onUrlChange(''); }}><X /></Button>
    </div>}
    <Label htmlFor={`${id}-url`}>Bildlänk (valfritt)</Label>
    <Input id={`${id}-url`} type="url" value={imageUrl} disabled={disabled || Boolean(file)} onChange={e => onUrlChange(e.target.value)} />
  </div>;
}