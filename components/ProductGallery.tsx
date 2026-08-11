'use client';
import Image from 'next/image';
import { useState } from 'react';
import { product } from '@/lib/product';
export function ProductGallery() { const [active, setActive] = useState(2); return <div><div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[#ead9c7]"><Image priority src={product.images[active]} alt="Summer comfort sandal" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw"/><span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">SoftWalk comfort</span></div><div className="mt-4 flex gap-3 overflow-x-auto pb-1">{product.images.map((src, index) => <button aria-label={`Show product image ${index + 1}`} key={src} onClick={() => setActive(index)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${index === active ? 'border-clay' : 'border-transparent'}`}><Image src={src} alt="Sandal detail" fill className="object-cover" sizes="80px"/></button>)}</div></div>; }
