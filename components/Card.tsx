export default function Card({ children }: { children: React.ReactNode }){
  return (
    <div className="card overflow-hidden">{children}</div>
  )
}