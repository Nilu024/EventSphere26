import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function WaitingQueue({ onLeave, leaving }) {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardContent className="space-y-5 py-12">
        <div className="relative mx-auto h-20 w-20" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
          <span className="absolute inset-3 rounded-full bg-gradient-to-br from-accent to-secondary" />
        </div>
        <div role="status"><h2 className="text-xl font-bold">Finding your match…</h2><p className="mt-1 text-sm text-muted">Stay on this page. We check for a match every few seconds.</p></div>
        <Button variant="outline" loading={leaving} onClick={onLeave}>Leave queue</Button>
      </CardContent>
    </Card>
  );
}
