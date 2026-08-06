export default function LoadingSkeleton(){
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-6 bg-gray-800 rounded w-3/4" />
      <div className="h-4 bg-gray-800 rounded w-full" />
      <div className="h-4 bg-gray-800 rounded w-5/6" />
    </div>
  )
}
