'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const socialLinks: Array<{
  icon: ReactNode
  href: string
  label: string
}> = [
  {
    icon: <span className="text-lg font-bold">𝕏</span>,
    href: 'https://x.com/Brunopenzar',
    label: 'Twitter',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    href: 'https://github.com/BPenzar',
    label: 'GitHub',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    href: 'https://www.linkedin.com/in/bruno-penzar',
    label: 'LinkedIn',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    href: 'mailto:penzar.bruno@gmail.com',
    label: 'Email',
  },
]

export function Footer() {
  const year = new Date().getFullYear()
  const pathname = usePathname()
  const isPublicForm = pathname?.startsWith('/f/')
  const publicLinks = socialLinks

  if (isPublicForm) {
    return (
      <footer className="mt-auto border-t bg-gray-50 py-8">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold text-gray-900 transition-colors hover:text-primary"
          >
            Business Feedback Tool
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            © {year}{' '}
            <a
              href="https://www.bsp-lab.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gray-900 transition-colors hover:text-primary"
            >
              BSP Lab
            </a>{' '}
            • Bruno Penzar
          </p>
          <div className="mt-4 flex justify-center gap-4 text-gray-500">
            {publicLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-gray-500 transition-colors hover:text-gray-900"
              >
                {social.icon}
              </a>
            ))}
            <a
              href="https://qr.bsp-lab.dev/f/wxEpRhWB"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Feedback"
              className="text-gray-500 transition-colors hover:text-gray-900"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="mt-auto border-t bg-gray-50 py-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col">
            <a
              href="https://qr.bsp-lab.dev/f/wxEpRhWB"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 inline-block w-fit rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-yellow-600 shadow-sm transition duration-150 hover:bg-amber-100 hover:shadow-md"
            >
              Leave us your feedback
            </a>
            <p className="text-left text-sm text-gray-600">
              © {year}{' '}
              <a
                href="https://www.bsp-lab.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 transition-colors hover:text-primary"
              >
                BSP Lab
              </a>{' '}
              • Bruno Penzar
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 text-gray-600 md:items-end">
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-gray-500 transition-colors hover:text-gray-900"
                >
                  {social.icon}
                </a>
              ))}
            </div>

            <div className="text-sm text-gray-500 md:text-right">
              Contact:{' '}
              <a
                href="mailto:penzar.bruno@gmail.com"
                className="text-gray-700 underline transition hover:text-primary"
              >
                penzar.bruno@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
