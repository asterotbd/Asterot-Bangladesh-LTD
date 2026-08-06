"use client"
import { useEffect, useState } from 'react'
import Button from './Button'

type Company = any

function inputClass() {
  return 'mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25'
}

export default function AdminCompanyForm(){
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|undefined>()
  const [company, setCompany] = useState<Company>({})

  useEffect(()=>{
    fetch('/api/admin/company').then(r=>r.json()).then(j=>{
      setCompany(j.data || {})
      setLoading(false)
    }).catch(e=>{ setError(String(e)); setLoading(false) })
  },[])

  const onChange = (k:string, v:any) => setCompany((s:any)=>({ ...s, [k]: v }))

  const save = async () => {
    setSaving(true)
    setError(undefined)
    const res = await fetch('/api/admin/company', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(company) })
    const j = await res.json()
    if (!res.ok) setError(j.error || 'Save failed')
    else setCompany(j.data)
    setSaving(false)
  }

  if (loading) return <div>Loading…</div>

  return (
    <div className="w-full max-w-[min(70rem,100%)]">
      {error && <div className="text-red-400">{error}</div>}
      <label className="block mb-2 text-sm font-medium text-gray-300">Company Name (EN)
        <input value={company.name_en||''} onChange={e=>onChange('name_en', e.target.value)} className={inputClass()} />
      </label>
      <label className="block mb-2 text-sm font-medium text-gray-300">Founded Date
        <input type="date" value={company.founded_date||''} onChange={e=>onChange('founded_date', e.target.value)} className={inputClass()} />
      </label>
      <label className="block mb-2 text-sm font-medium text-gray-300">Tagline (EN)
        <input value={company.tagline_en||''} onChange={e=>onChange('tagline_en', e.target.value)} className={inputClass()} />
      </label>
      <label className="block mb-4 text-sm font-medium text-gray-300">Slogan (EN)
        <input value={company.slogan_en||''} onChange={e=>onChange('slogan_en', e.target.value)} className={inputClass()} />
      </label>
      <label className="block mb-4 text-sm font-medium text-gray-300">Short Description (EN)
        <textarea value={company.short_description_en||''} onChange={e=>onChange('short_description_en', e.target.value)} className={inputClass()} rows={4} />
      </label>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>
    </div>
  )
}
