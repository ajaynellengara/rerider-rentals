import { PhoneCall, Siren } from 'lucide-react'

const categories = ['Accident', 'Vehicle Breakdown', 'Vehicle Maintenance', 'Other Emergency']

export function EmergencyAssistance({ phone, whatsapp }: { phone: string; whatsapp: string }) {
  const phoneHref = phone ? `tel:${phone}` : null
  const whatsappNumber = whatsapp.replace(/\D/g, '')

  return <section className="rounded-xl border border-red-200 bg-red-50 p-4">
    <h2 className="flex items-center gap-2 font-semibold text-red-900"><Siren className="h-5 w-5" /> Emergency Assistance</h2>
    <p className="mt-1 text-sm text-red-800">Choose the issue and contact ReRider support. If anyone is in immediate danger, contact local emergency services first.</p>
    <details className="mt-4 rounded-lg border border-red-200 bg-white p-3">
      <summary className="cursor-pointer font-semibold text-slate-800">Choose an emergency category</summary>
      <div className="mt-3 space-y-3">{categories.map((category) => {
        const message = encodeURIComponent(`ReRider emergency assistance: ${category}`)
        const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${message}` : null
        return <div key={category} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><p className="text-sm font-medium text-slate-800">{category}</p><div className="flex gap-2">{whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">WhatsApp</a> : null}{phoneHref ? <a href={phoneHref} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-200"><PhoneCall className="h-3.5 w-3.5" />Call ReRider Support</a> : null}{!whatsappHref && !phoneHref ? <span className="text-xs text-slate-500">Support contact details are not configured.</span> : null}</div></div>
      })}</div>
    </details>
  </section>
}
