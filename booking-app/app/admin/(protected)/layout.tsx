import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken } from '@/lib/auth'
import AdminShell from './AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const session = cookieStore.get('admin_session')

  if (!session?.value || !verifySessionToken(session.value)) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}
