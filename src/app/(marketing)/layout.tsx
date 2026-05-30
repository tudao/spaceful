import { AppNav } from '@/components/nav/AppNav';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
