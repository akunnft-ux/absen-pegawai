'use client'

import { useActionState } from 'react'
import { login } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardCheck, Loader2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, { error: '' })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">AbsenKu</CardTitle>
          <CardDescription>Sistem Manajemen Kehadiran Pegawai</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {state?.error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {pending ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
