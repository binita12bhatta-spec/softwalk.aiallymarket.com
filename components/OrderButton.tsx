'use client';
import { useRouter } from 'next/navigation';
import { product, subtotal } from '@/lib/product';
export function OrderButton({ quantity = 1, children = 'Order now', className = '' }: { quantity?: number; children?: React.ReactNode; className?: string }) {
  const router = useRouter();
  const go = () => router.push(`/checkout?product=${encodeURIComponent(product.name)}&quantity=${quantity}&price=${subtotal(quantity) / quantity}&total=${subtotal(quantity)}`);
  return <button onClick={go} className={`rounded-full bg-clay px-6 py-3 text-sm font-bold text-white shadow-lg shadow-clay/20 transition hover:-translate-y-0.5 hover:bg-[#ad442b] ${className}`}>{children}</button>;
}
