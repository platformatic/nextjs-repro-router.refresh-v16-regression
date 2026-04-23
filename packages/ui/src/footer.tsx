export function Footer({ version }: { version: string }): React.JSX.Element {
  return (
    <footer className="mt-16 border-t border-gray-200 py-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
      <p>
        Running on{' '}
        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
          Next.js v{version}
        </span>
      </p>
    </footer>
  )
}
