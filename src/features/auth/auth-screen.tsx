import * as React from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BRANCH_OPTIONS, type BranchName } from '@/types/pos'
import { usePosStore } from '@/state/pos-store'

type Mode = 'login' | 'create'

export function AuthScreen() {
  const { login, createAccount, authAccounts } = usePosStore()
  const [mode, setMode] = React.useState<Mode>('login')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [branch, setBranch] = React.useState<BranchName | ''>('')
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const canLogin = username.trim().length > 0 && password.length > 0 && branch !== ''
  const canCreate = username.trim().length > 0 && password.trim().length >= 4

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!branch) {
      setError('Please select a branch.')
      return
    }

    const result = login(username, password, branch)
    if (!result.ok) {
      setError(result.error ?? 'Unable to login.')
    }
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const result = createAccount(username, password)
    if (!result.ok) {
      setError(result.error ?? 'Unable to create account.')
      return
    }

    setSuccess('Account created. You can now login.')
    setMode('login')
    setPassword('')
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-background">
      <Card className="w-full max-w-md border border-border/70 bg-card/90 backdrop-blur">
        <CardHeader>
          <CardTitle>Custom POS Access</CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Login to continue. Branch selection is required per session.'
              : 'Create a local account for this POS device.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>
              Login
            </Button>
            <Button type="button" variant={mode === 'create' ? 'default' : 'outline'} onClick={() => setMode('create')}>
              Create Account
            </Button>
          </div>

          <form className="space-y-3" onSubmit={mode === 'login' ? handleLogin : handleCreate}>
            <div className="space-y-1.5">
              <Label htmlFor="auth-username">Username</Label>
              <Input
                id="auth-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'create' ? 'Minimum 4 characters' : 'Enter password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'login' && (
              <div className="space-y-1.5">
                <Label>Branch</Label>
                <Select value={branch} onValueChange={(value) => setBranch(value as BranchName)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((branchName) => (
                      <SelectItem key={branchName} value={branchName}>
                        {branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}

            <Button type="submit" className="w-full" disabled={mode === 'login' ? !canLogin : !canCreate}>
              {mode === 'login' ? 'Login' : 'Create Account'}
            </Button>

            <p className="text-[11px] text-muted-foreground">
              Existing accounts on this device: <span className="font-medium text-foreground">{authAccounts.length}</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
