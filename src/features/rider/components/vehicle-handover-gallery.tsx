'use client'

import { useState } from 'react'
import Image from 'next/image'

export type HandoverPhoto = { id: string; label: string; src: string; caption: string | null }

export function VehicleHandoverGallery({ photos }: { photos: HandoverPhoto[] }) {
  const [selected, setSelected] = useState<HandoverPhoto | null>(null)
  const angles = ['Front view', 'Rear view', 'Left-side view', 'Right-side view']
  const requiredPhotos = angles.map((label) => photos.find((photo) => photo.label === label) ?? null)
  const otherPhotos = photos.filter((photo) => !angles.includes(photo.label))

  return <>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{requiredPhotos.map((photo, index) => photo ? <button key={photo.id} type="button" onClick={() => setSelected(photo)} className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500"><Image unoptimized src={photo.src} width={640} height={640} alt={`${photo.label} handover`} className="aspect-square w-full object-cover transition-transform group-hover:scale-105" /><span className="block p-2 text-xs font-medium text-slate-700">{angles[index]}</span></button> : <div key={angles[index]} className="flex aspect-square flex-col justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center"><span className="text-xs font-medium text-slate-700">{angles[index]}</span><span className="mt-1 text-[11px] text-slate-500">Photo unavailable</span></div>)}</div>
    {otherPhotos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{otherPhotos.map((photo) => <button key={photo.id} type="button" onClick={() => setSelected(photo)} className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-orange-500"><Image unoptimized src={photo.src} width={640} height={640} alt={`${photo.label} handover`} className="aspect-square w-full object-cover transition-transform group-hover:scale-105" /><span className="block p-2 text-xs font-medium text-slate-700">{photo.label}</span></button>)}</div>}
    {selected && <div role="presentation" onClick={() => setSelected(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><section role="dialog" aria-modal="true" aria-label={`${selected.label} handover photo`} onClick={(event) => event.stopPropagation()} className="w-full max-w-4xl"><button type="button" autoFocus onClick={() => setSelected(null)} className="mb-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900">Close photo</button><Image unoptimized src={selected.src} width={1600} height={1200} alt={`${selected.label} handover`} className="max-h-[80vh] w-full rounded-xl object-contain" /><p className="mt-2 text-center text-sm text-white">{selected.caption || selected.label}</p></section></div>}
  </>
}
