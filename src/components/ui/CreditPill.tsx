import Link from 'next/link';
import { Gem } from 'lucide-react';
import { creditPillClass, formatCredits } from '@/lib/utils';

interface CreditPillProps {
  balance: number;
  href?: string;
}

export function CreditPill({ balance, href = '/account/credits' }: CreditPillProps) {
  return (
    <Link href={href} className={creditPillClass(balance)}>
      <Gem className="gem" size={15} />
      {formatCredits(balance)} credits
    </Link>
  );
}
