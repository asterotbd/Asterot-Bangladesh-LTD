export default function Card({ children }: { children: React.ReactNode }){
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-md">{children}</div>
  )
}
