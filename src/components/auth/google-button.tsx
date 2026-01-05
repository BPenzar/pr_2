'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GoogleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
}

export function GoogleButton({ label = 'Continue with Google', className, ...props }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        'w-full gap-2 border border-input bg-background text-foreground shadow-sm hover:bg-muted/60',
        className
      )}
      {...props}
    >
      <GoogleIcon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.38 1.45 8.25 3.22l6.12-5.95C34.63 3.28 29.7 1 24 1 14.92 1 7.2 6.2 3.6 13.75l7.1 5.5C12.48 13.1 17.82 9.5 24 9.5z"
      />
      <path
        fill="#34A853"
        d="M46.2 24.5c0-1.64-.14-3.22-.42-4.75H24v9h12.55c-.54 2.9-2.16 5.36-4.6 7.02l7.1 5.5c4.14-3.82 6.15-9.45 6.15-16.77z"
      />
      <path
        fill="#FBBC05"
        d="M10.7 28.25c-.52-1.54-.82-3.18-.82-4.88 0-1.7.3-3.34.82-4.88l-7.1-5.5C1.98 16.67 1 20.26 1 23.37c0 3.1.98 6.7 2.6 10.38l7.1-5.5z"
      />
      <path
        fill="#4285F4"
        d="M24 46c5.7 0 10.63-1.88 14.17-5.13l-7.1-5.5C29.1 36.8 26.7 37.5 24 37.5c-6.18 0-11.52-3.6-13.3-8.75l-7.1 5.5C7.2 41.8 14.92 46 24 46z"
      />
    </svg>
  )
}
