export default function Section({ children, className=''}: { children: React.ReactNode, className?: string }){
  return (
    <section className={`py-12 ${className}`}>{children}</section>
  )
}
