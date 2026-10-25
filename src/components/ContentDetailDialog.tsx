import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function ContentDetailDialog({ item, onClose, kind }: {
  item: { title: string; text: string; imageUrl?: string | null; detail: string } | null;
  onClose: () => void; kind: 'news' | 'player';
}) {
  return <Dialog open={Boolean(item)} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-lg p-6 sm:p-8">
      {item && <>
        <div className="space-y-3 pr-7">
          <DialogTitle className="break-words font-display text-3xl leading-tight">{item.title}</DialogTitle>
          <DialogDescription className="text-gold">{item.detail}</DialogDescription>
        </div>
        {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="max-h-[48dvh] w-full rounded-md bg-muted object-contain" />}
        {item.text ? <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{item.text}</p> : kind === 'player' ? <p className="text-sm text-muted-foreground">Ingen ytterligare spelarinfo ännu.</p> : null}
      </>}
    </DialogContent>
  </Dialog>;
}