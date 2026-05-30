import { AppNav } from '@/components/nav/AppNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // TODO: replace with server-side session + credit balance fetch
  return (
    <>
      <AppNav authenticated creditBalance={14} userInitial="L" />
      {children}
    </>
  );
}
