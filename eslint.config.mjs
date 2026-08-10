import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Build artifacts and generated output must never be linted: they are
    // minified bundles that produced ~39k spurious problems and masked the
    // handful of real source findings.
    ignores: [
      'node_modules/**',
      '.next/**',
      '.open-next/**',
      '.wrangler/**',
      '.wrangler-test/**',
      'out/**',
      'coverage/**',
      'artifacts/**',
      'legacy/**',
      'playwright-report/**',
      'test-results/**',
      'supabase/functions/_shared/**',
    ],
  },
]

export default eslintConfig
