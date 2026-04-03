export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="embed-shell bg-white">
      {children}
    </div>
  )
}
