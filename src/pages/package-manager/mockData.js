import { LICENSES } from './constants.js'

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const makeVersion = (major, minor, patch) => `${major}.${minor}.${patch}`

const makeSubDeps = (count, level = 0) => {
  if (level > 2 || count <= 0) return []
  const subNames = [
    'lodash', 'ms', 'has-flag', 'supports-color', 'ansi-styles',
    'color-convert', 'color-name', 'is-buffer', 'isarray', 'path-is-absolute',
    'inherits', 'util-deprecate', 'braces', 'fill-range', 'is-number',
    'to-regex-range', 'micromatch', 'picomatch', 'anymatch', 'normalize-path',
    'glob-parent', 'is-glob', 'fast-glob', 'merge2', 'chokidar',
    'readdirp', 'fsevents', 'strip-bom', 'js-tokens', 'loose-envify',
    'react-is', 'scheduler', 'object-assign', 'prop-types', 'hoist-non-react-statics',
    'clsx', 'tailwind-merge', 'csstype', 'dom-helpers', '@babel/runtime',
    'regenerator-runtime', 'tslib', 'dayjs', 'date-fns', 'axios',
    'follow-redirects', 'debug', 'mime-db', 'mime-types', 'http-errors',
  ]
  const result = []
  const usedNames = new Set()
  const actualCount = Math.min(count, subNames.length)
  for (let i = 0; i < actualCount; i++) {
    const name = subNames[randomInt(0, subNames.length - 1)]
    if (usedNames.has(name)) continue
    usedNames.add(name)
    const major = randomInt(0, 3)
    const minor = randomInt(0, 15)
    const patch = randomInt(0, 20)
    const installed = makeVersion(major, minor, patch)
    const latestMajor = major + randomInt(0, 2)
    const latestMinor = latestMajor === major ? minor + randomInt(1, 5) : randomInt(0, 10)
    const latest = makeVersion(latestMajor, latestMinor, randomInt(0, 15))
    result.push({
      name,
      versionRange: `^${makeVersion(major, minor, 0)}`,
      installedVersion: installed,
      latestVersion: latest,
      license: randomChoice(LICENSES),
      size: randomInt(500, 500000),
      dependencies: makeSubDeps(randomInt(0, level === 0 ? 3 : 1), level + 1),
    })
  }
  return result
}

export const getMockDependencies = () => {
  const deps = [
    {
      name: 'react',
      versionRange: '^19.2.6',
      installedVersion: '19.2.6',
      latestVersion: '19.4.0',
      license: 'MIT',
      size: 3200000,
      dependencies: [
        {
          name: 'loose-envify',
          versionRange: '^1.1.0',
          installedVersion: '1.4.0',
          latestVersion: '1.4.0',
          license: 'MIT',
          size: 5600,
          dependencies: [
            {
              name: 'js-tokens',
              versionRange: '^4.0.0',
              installedVersion: '4.0.0',
              latestVersion: '4.0.1',
              license: 'MIT',
              size: 12000,
              dependencies: [],
            },
          ],
        },
        {
          name: 'react-is',
          versionRange: '^19.2.6',
          installedVersion: '19.2.6',
          latestVersion: '19.4.0',
          license: 'MIT',
          size: 28000,
          dependencies: [],
        },
        {
          name: 'scheduler',
          versionRange: '^0.25.6',
          installedVersion: '0.25.6',
          latestVersion: '0.25.8',
          license: 'MIT',
          size: 68000,
          dependencies: [],
        },
      ],
    },
    {
      name: 'react-dom',
      versionRange: '^19.2.6',
      installedVersion: '19.2.6',
      latestVersion: '19.4.0',
      license: 'MIT',
      size: 4500000,
      dependencies: [
        {
          name: 'scheduler',
          versionRange: '^0.25.6',
          installedVersion: '0.25.6',
          latestVersion: '0.25.8',
          license: 'MIT',
          size: 68000,
          dependencies: [],
        },
      ],
    },
    {
      name: 'react-router-dom',
      versionRange: '^7.17.0',
      installedVersion: '7.15.2',
      latestVersion: '7.18.1',
      license: 'MIT',
      size: 520000,
      dependencies: [
        {
          name: 'react-router',
          versionRange: '^7.17.0',
          installedVersion: '7.15.2',
          latestVersion: '7.18.1',
          license: 'MIT',
          size: 280000,
          dependencies: [
            {
              name: '@remix-run/router',
              versionRange: '^1.21.0',
              installedVersion: '1.19.3',
              latestVersion: '1.22.0',
              license: 'MIT',
              size: 860000,
              dependencies: [],
            },
          ],
        },
      ],
    },
    {
      name: 'recharts',
      versionRange: '^3.8.1',
      installedVersion: '3.8.1',
      latestVersion: '3.10.0',
      license: 'MIT',
      size: 1800000,
      dependencies: [
        {
          name: 'clsx',
          versionRange: '^2.0.0',
          installedVersion: '2.1.1',
          latestVersion: '2.1.1',
          license: 'MIT',
          size: 7200,
          dependencies: [],
        },
        {
          name: 'react-is',
          versionRange: '^18.0.0',
          installedVersion: '18.3.1',
          latestVersion: '18.3.1',
          license: 'MIT',
          size: 24000,
          dependencies: [],
        },
        {
          name: 'victory-vendor',
          versionRange: '^37.0.0',
          installedVersion: '37.1.2',
          latestVersion: '37.2.0',
          license: 'MIT',
          size: 1200000,
          dependencies: [],
        },
      ],
    },
    {
      name: 'xlsx',
      versionRange: '^0.18.5',
      installedVersion: '0.17.3',
      latestVersion: '1.0.0',
      license: 'Apache-2.0',
      size: 3200000,
      dependencies: makeSubDeps(2),
    },
    {
      name: '@dnd-kit/core',
      versionRange: '^6.3.1',
      installedVersion: '6.3.1',
      latestVersion: '6.5.0',
      license: 'MIT',
      size: 420000,
      dependencies: [
        {
          name: 'tslib',
          versionRange: '^2.0.0',
          installedVersion: '2.6.2',
          latestVersion: '2.7.0',
          license: '0BSD',
          size: 42000,
          dependencies: [],
        },
      ],
    },
    {
      name: '@dnd-kit/sortable',
      versionRange: '^10.0.0',
      installedVersion: '10.0.0',
      latestVersion: '10.1.2',
      license: 'MIT',
      size: 180000,
      dependencies: makeSubDeps(1),
    },
  ]
  return deps
}

export const getMockDevDependencies = () => {
  return [
    {
      name: 'vite',
      versionRange: '^8.0.12',
      installedVersion: '8.0.10',
      latestVersion: '8.1.3',
      license: 'MIT',
      size: 2800000,
      dependencies: [
        {
          name: 'esbuild',
          versionRange: '^0.25.0',
          installedVersion: '0.25.2',
          latestVersion: '0.25.4',
          license: 'MIT',
          size: 15000000,
          dependencies: [],
        },
        {
          name: 'rollup',
          versionRange: '^4.30.0',
          installedVersion: '4.30.1',
          latestVersion: '4.34.0',
          license: 'MIT',
          size: 680000,
          dependencies: [],
        },
        {
          name: 'picocolors',
          versionRange: '^1.1.0',
          installedVersion: '1.1.0',
          latestVersion: '1.1.1',
          license: 'ISC',
          size: 6500,
          dependencies: [],
        },
      ],
    },
    {
      name: 'vitest',
      versionRange: '^4.1.8',
      installedVersion: '4.1.5',
      latestVersion: '4.2.0',
      license: 'MIT',
      size: 3500000,
      dependencies: [
        {
          name: '@vitest/runner',
          versionRange: '^4.1.8',
          installedVersion: '4.1.5',
          latestVersion: '4.2.0',
          license: 'MIT',
          size: 120000,
          dependencies: [],
        },
        {
          name: 'vite-node',
          versionRange: '^4.1.8',
          installedVersion: '4.1.5',
          latestVersion: '4.2.0',
          license: 'MIT',
          size: 280000,
          dependencies: [],
        },
        {
          name: 'tinybench',
          versionRange: '^2.9.0',
          installedVersion: '2.9.0',
          latestVersion: '2.10.0',
          license: 'MIT',
          size: 18000,
          dependencies: [],
        },
      ],
    },
    {
      name: '@vitejs/plugin-react',
      versionRange: '^6.0.1',
      installedVersion: '6.0.1',
      latestVersion: '6.1.0',
      license: 'MIT',
      size: 48000,
      dependencies: [
        {
          name: '@babel/core',
          versionRange: '^7.29.0',
          installedVersion: '7.29.0',
          latestVersion: '7.30.2',
          license: 'MIT',
          size: 980000,
          dependencies: makeSubDeps(3, 1),
        },
        {
          name: 'babel-plugin-react-compiler',
          versionRange: '^1.0.0',
          installedVersion: '1.0.0',
          latestVersion: '1.1.0',
          license: 'MIT',
          size: 1200000,
          dependencies: makeSubDeps(2, 1),
        },
      ],
    },
    {
      name: 'eslint',
      versionRange: '^10.3.0',
      installedVersion: '10.2.0',
      latestVersion: '10.4.1',
      license: 'MIT',
      size: 2200000,
      dependencies: [
        {
          name: '@eslint/js',
          versionRange: '^10.0.1',
          installedVersion: '10.0.1',
          latestVersion: '10.1.0',
          license: 'MIT',
          size: 42000,
          dependencies: [],
        },
        {
          name: 'globals',
          versionRange: '^17.6.0',
          installedVersion: '17.6.0',
          latestVersion: '17.8.0',
          license: 'MIT',
          size: 56000,
          dependencies: [],
        },
      ],
    },
    {
      name: 'eslint-plugin-react-hooks',
      versionRange: '^7.1.1',
      installedVersion: '7.1.1',
      latestVersion: '7.2.0',
      license: 'MIT',
      size: 32000,
      dependencies: [],
    },
    {
      name: 'eslint-plugin-react-refresh',
      versionRange: '^0.5.2',
      installedVersion: '0.5.1',
      latestVersion: '0.5.3',
      license: 'MIT',
      size: 18000,
      dependencies: [],
    },
    {
      name: '@types/react',
      versionRange: '^19.2.14',
      installedVersion: '19.2.10',
      latestVersion: '19.3.0',
      license: 'MIT',
      size: 420000,
      dependencies: [
        {
          name: '@types/prop-types',
          versionRange: '*',
          installedVersion: '15.7.12',
          latestVersion: '15.7.13',
          license: 'MIT',
          size: 12000,
          dependencies: [],
        },
      ],
    },
    {
      name: '@types/react-dom',
      versionRange: '^19.2.3',
      installedVersion: '19.2.3',
      latestVersion: '19.3.0',
      license: 'MIT',
      size: 28000,
      dependencies: [],
    },
  ]
}

export const getMockOperationHistory = () => {
  return [
    {
      id: 'op-001',
      timestamp: Date.now() - 86400000 * 3,
      type: 'upgrade',
      packageCount: 5,
      summary: 'react, vite, vitest 等 5 个包',
    },
    {
      id: 'op-002',
      timestamp: Date.now() - 86400000 * 7,
      type: 'upgrade',
      packageCount: 2,
      summary: 'eslint, eslint-plugin-react-hooks',
    },
    {
      id: 'op-003',
      timestamp: Date.now() - 86400000 * 14,
      type: 'install',
      packageCount: 1,
      summary: '新增 recharts 图表库',
    },
  ]
}
