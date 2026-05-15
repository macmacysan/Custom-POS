import * as React from 'react'
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
import { cn } from '@/lib/utils'

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
    if (!branch) { setError('Please select a branch.'); return }
    const result = login(username, password, branch)
    if (!result.ok) setError(result.error ?? 'Unable to login.')
  }

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const result = createAccount(username, password)
    if (!result.ok) { setError(result.error ?? 'Unable to create account.'); return }
    setSuccess('Account created. You can now login.')
    setMode('login')
    setPassword('')
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">

      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-4">

        {/* POS terminal mark */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center justify-center size-14 rounded-xl bg-primary text-primary-foreground font-mono font-black text-xl tracking-tight shadow-lg shadow-primary/30">
            POS
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Cashiers Report</h1>
            <p className="text-xs text-muted-foreground">Nueva Camsur Home Furnishing</p>
          </div>
        </div>

        {/* Mode switcher */}
        <div className="grid grid-cols-2 gap-1.5 mb-5 p-1 rounded-lg bg-muted border border-border">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn(
              'text-xs font-semibold py-1.5 rounded-md transition-all',
              mode === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={cn(
              'text-xs font-semibold py-1.5 rounded-md transition-all',
              mode === 'create'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Create Account
          </button>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-5 space-y-3.5">
          <form onSubmit={mode === 'login' ? handleLogin : handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="auth-username" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Username
              </Label>
              <Input
                id="auth-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                className="h-9 font-mono text-sm bg-background border-border focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="auth-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'create' ? 'Minimum 4 characters' : '••••••••'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="h-9 font-mono text-sm bg-background border-border focus-visible:ring-primary/30"
              />
            </div>

            {mode === 'login' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Branch
                </Label>
                <Select value={branch} onValueChange={(value) => setBranch(value as BranchName)}>
                  <SelectTrigger className="h-9 w-full bg-background border-border text-sm">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANCH_OPTIONS.map((branchName) => (
                      <SelectItem key={branchName} value={branchName} className="text-sm font-medium">
                        {branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status messages */}
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-9 font-semibold text-sm mt-1"
              disabled={mode === 'login' ? !canLogin : !canCreate}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground/60 border-t border-border pt-3">
            {authAccounts.length === 0
              ? 'No accounts on this device yet.'
              : `${authAccounts.length} account${authAccounts.length > 1 ? 's' : ''} registered on this device`}
          </p>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/40 mt-5 font-mono">
          POS Terminal v1.0 · Offline-capable
        </p>
      </div>
    </div>
  )
}
