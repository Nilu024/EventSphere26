import { Button } from '@/components/ui/button';
export function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted">{error?.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-2"><Button onClick={resetErrorBoundary}>Try again</Button><Button variant="outline" onClick={() => { window.location.href = '/'; }}>Go home</Button></div>
    </div>
  );
}
