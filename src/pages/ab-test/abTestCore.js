import { EXPERIMENT_STATUS, METRICS, DATA_DAYS, P_VALUE_THRESHOLD } from './constants.js'

let idCounter = 0

export function generateId(prefix = 'exp') {
  idCounter += 1
  return `${prefix}_${Date.now()}_${idCounter}`
}

export function generateGroupId() {
  return generateId('group')
}

export function createExperiment({ name, description, controlGroup, experimentGroups, metrics }) {
  const groups = [
    { ...controlGroup, id: generateGroupId(), isControl: true },
    ...experimentGroups.map((g) => ({ ...g, id: generateGroupId(), isControl: false })),
  ]

  return {
    id: generateId(),
    name,
    description,
    groups,
    metrics,
    status: EXPERIMENT_STATUS.NOT_STARTED,
    createdAt: Date.now(),
    startedAt: null,
    endedAt: null,
    timeSeriesData: {},
  }
}

export function createGroup(name, traffic = 50, config = {}) {
  return {
    name,
    traffic,
    config,
  }
}

export function adjustTrafficAllocation(groups, changedGroupId, newTraffic) {
  if (!Array.isArray(groups) || groups.length === 0) return groups

  const clampedTraffic = Math.max(0, Math.min(100, newTraffic))

  const changedIndex = groups.findIndex((g) => g.id === changedGroupId)
  if (changedIndex === -1) return groups

  const otherGroups = groups.filter((_, i) => i !== changedIndex)
  if (otherGroups.length === 0) return groups

  const totalOtherTraffic = otherGroups.reduce((sum, g) => sum + g.traffic, 0)
  const totalTraffic = clampedTraffic + totalOtherTraffic

  if (totalTraffic === 0) return groups

  const diff = 100 - clampedTraffic - totalOtherTraffic

  if (totalOtherTraffic === 0) {
    const perGroup = diff / otherGroups.length
    return groups.map((g, i) => {
      if (i === changedIndex) return { ...g, traffic: clampedTraffic }
      return { ...g, traffic: Math.round(perGroup * 100) / 100 }
    })
  }

  const newGroups = groups.map((g, i) => {
    if (i === changedIndex) {
      return { ...g, traffic: clampedTraffic }
    }

    const ratio = g.traffic / totalOtherTraffic
    const newTrafficVal = g.traffic + diff * ratio
    const rounded = Math.round(newTrafficVal * 100) / 100
    return { ...g, traffic: Math.max(0, rounded) }
  })

  const currentTotal = newGroups.reduce((sum, g) => sum + g.traffic, 0)
  const roundingError = Math.round((100 - currentTotal) * 100) / 100

  if (Math.abs(roundingError) > 0.001) {
    const lastOtherIndex = newGroups.findIndex((g, i) => i !== changedIndex && g.traffic + roundingError >= 0)
    if (lastOtherIndex !== -1) {
      newGroups[lastOtherIndex] = {
        ...newGroups[lastOtherIndex],
        traffic: Math.round((newGroups[lastOtherIndex].traffic + roundingError) * 100) / 100,
      }
    }
  }

  return newGroups
}

export function validateTrafficAllocation(groups) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return { valid: false, error: '至少需要一个组' }
  }

  const total = groups.reduce((sum, g) => sum + (g.traffic || 0), 0)
  const hasControl = groups.some((g) => g.isControl)

  if (!hasControl) {
    return { valid: false, error: '必须有一个对照组' }
  }

  if (Math.abs(total - 100) > 0.01) {
    return { valid: false, error: `所有组流量总和必须为 100%，当前为 ${total.toFixed(2)}%` }
  }

  for (const g of groups) {
    if (g.traffic < 0 || g.traffic > 100) {
      return { valid: false, error: `组 ${g.name} 的流量必须在 0-100 之间` }
    }
  }

  return { valid: true }
}

export function canStartExperiment(experiment) {
  if (!experiment) return false
  return experiment.status === EXPERIMENT_STATUS.NOT_STARTED
}

export function canStopExperiment(experiment) {
  if (!experiment) return false
  return experiment.status === EXPERIMENT_STATUS.RUNNING
}

export function startExperiment(experiment) {
  if (!canStartExperiment(experiment)) return experiment

  return {
    ...experiment,
    status: EXPERIMENT_STATUS.RUNNING,
    startedAt: Date.now(),
    timeSeriesData: generateInitialTimeSeriesData(experiment),
  }
}

export function stopExperiment(experiment) {
  if (!canStopExperiment(experiment)) return experiment

  return {
    ...experiment,
    status: EXPERIMENT_STATUS.ENDED,
    endedAt: Date.now(),
  }
}

export function generateInitialTimeSeriesData(experiment) {
  const data = {}

  experiment.metrics.forEach((metricKey) => {
    data[metricKey] = generateTimeSeriesForMetric(experiment, metricKey)
  })

  return data
}

export function generateTimeSeriesForMetric(experiment, metricKey) {
  const metric = METRICS.find((m) => m.key === metricKey)
  if (!metric) return []

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const data = []

  for (let i = DATA_DAYS - 1; i >= 0; i--) {
    const date = new Date(now - i * dayMs)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`

    const dayData = { date: dateStr }

    experiment.groups.forEach((group) => {
      const baseValue = metric.baseValue
      const variation = group.isControl ? 0 : (Math.random() - 0.3) * baseValue * 0.3
      const groupVariation = (Math.random() - 0.5) * baseValue * 0.1
      const value = Math.max(0, baseValue + variation + groupVariation)
      dayData[group.id] = Math.round(value * 100) / 100
      dayData[`${group.id}_samples`] = Math.floor(Math.random() * 500) + 100
    })

    data.push(dayData)
  }

  return data
}

export function updateTimeSeriesData(experiment) {
  if (experiment.status !== EXPERIMENT_STATUS.RUNNING) return experiment

  const newTimeSeriesData = { ...experiment.timeSeriesData }

  experiment.metrics.forEach((metricKey) => {
    const currentData = newTimeSeriesData[metricKey] || []
    if (currentData.length === 0) return

    const lastEntry = { ...currentData[currentData.length - 1] }
    const metric = METRICS.find((m) => m.key === metricKey)

    experiment.groups.forEach((group) => {
      const currentValue = lastEntry[group.id] || metric.baseValue
      const delta = (Math.random() - 0.5) * metric.baseValue * 0.05
      lastEntry[group.id] = Math.max(0, Math.round((currentValue + delta) * 100) / 100)
      lastEntry[`${group.id}_samples`] = (lastEntry[`${group.id}_samples`] || 100) + Math.floor(Math.random() * 50)
    })

    newTimeSeriesData[metricKey] = [...currentData.slice(0, -1), lastEntry]
  })

  return { ...experiment, timeSeriesData: newTimeSeriesData }
}

export function calculateSignificance(experiment, metricKey) {
  const timeSeries = experiment.timeSeriesData[metricKey]
  if (!timeSeries || timeSeries.length === 0) return []

  const controlGroup = experiment.groups.find((g) => g.isControl)
  const experimentGroups = experiment.groups.filter((g) => !g.isControl)

  if (!controlGroup) return []

  const results = []

  experimentGroups.forEach((expGroup) => {
    const controlValues = []
    const expValues = []
    let controlSamples = 0
    let expSamples = 0

    timeSeries.forEach((day) => {
      controlValues.push(day[controlGroup.id])
      expValues.push(day[expGroup.id])
      controlSamples += day[`${controlGroup.id}_samples`] || 0
      expSamples += day[`${expGroup.id}_samples`] || 0
    })

    const controlMean = controlValues.reduce((a, b) => a + b, 0) / controlValues.length
    const expMean = expValues.reduce((a, b) => a + b, 0) / expValues.length

    const controlVariance = Math.max(0.0001, controlValues.reduce((sum, v) => sum + Math.pow(v - controlMean, 2), 0) / controlValues.length)
    const expVariance = Math.max(0.0001, expValues.reduce((sum, v) => sum + Math.pow(v - expMean, 2), 0) / expValues.length)

    const pooledVariance = ((controlSamples - 1) * controlVariance + (expSamples - 1) * expVariance) / (controlSamples + expSamples - 2)
    const standardError = Math.sqrt(Math.max(0.0001, pooledVariance * (1 / controlSamples + 1 / expSamples)))
    const tStatistic = (expMean - controlMean) / standardError

    const pValue = calculatePValue(tStatistic, controlSamples + expSamples - 2)

    const liftPercent = controlMean > 0 ? ((expMean - controlMean) / controlMean) * 100 : 0

    results.push({
      groupName: expGroup.name,
      metricKey,
      controlMean: Math.round(controlMean * 100) / 100,
      expMean: Math.round(expMean * 100) / 100,
      liftPercent: Math.round(liftPercent * 100) / 100,
      pValue: Math.round(pValue * 10000) / 10000,
      isSignificant: pValue < P_VALUE_THRESHOLD,
    })
  })

  return results
}

export function calculatePValue(tStatistic, degreesOfFreedom) {
  const t = Math.abs(tStatistic)
  const df = degreesOfFreedom

  if (df <= 0) return 1
  if (t === 0) return 1

  if (t >= 5) {
    return 0.00001
  }

  if (t >= 4) {
    return 0.0001 + (5 - t) * 0.0009
  }

  if (t >= 3) {
    return 0.001 + (4 - t) * 0.009
  }

  if (t >= 2) {
    return 0.01 + (3 - t) * 0.04
  }

  if (t >= 1.645) {
    return 0.05 + (2 - t) * 0.1
  }

  if (t >= 1) {
    return 0.32 + (1.645 - t) * 0.415
  }

  return 1 - 0.2 * t
}

export function regularizedIncompleteBeta(x, a, b) {
  if (x < 0 || x > 1) return 0
  if (x === 0) return 0
  if (x === 1) return 1

  if (a <= 0 || b <= 0) return 0

  try {
    const lnGammaAB = gammaLn(a + b)
    const lnGammaA = gammaLn(a)
    const lnGammaB = gammaLn(b)
    const lnX = Math.log(x)
    const ln1MinusX = Math.log(1 - x)

    const bt = Math.exp(lnGammaAB - lnGammaA - lnGammaB + a * lnX + b * ln1MinusX)

    if (isNaN(bt) || !isFinite(bt)) {
      return x < 0.5 ? 0 : 1
    }

    if (x < (a + 1) / (a + b + 2)) {
      const cf = betaCF(x, a, b)
      const result = bt * cf / a
      return isFinite(result) ? result : (x < 0.5 ? 0 : 1)
    } else {
      const cf = betaCF(1 - x, b, a)
      const result = 1 - bt * cf / b
      return isFinite(result) ? Math.max(0, Math.min(1, result)) : (x < 0.5 ? 0 : 1)
    }
  } catch {
    return x < 0.5 ? 0 : 1
  }
}

export function gammaLn(x) {
  const coef = [
    76.18009172947146,
    -86.5053203294168,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ]

  let y = x
  let tmp = x + 5.5
  tmp -= (x + 0.5) * Math.log(tmp)
  let ser = 1.00000000019

  for (let j = 0; j < 6; j++) {
    y += 1
    ser += coef[j] / y
  }

  return -tmp + Math.log(2.506628274631 * ser / x)
}

export function betaCF(x, a, b) {
  const maxIterations = 100
  const epsilon = 3e-7

  let bm = 1
  let az = 1
  let am = 1

  let qab = a + b
  let qap = a + 1
  let qam = a - 1
  let bz = 1 - qab * x / qap

  if (bz === 0) bz = epsilon

  for (let m = 1; m <= maxIterations; m++) {
    let em = m
    let tem = em + em
    let d = em * (b - m) * x / ((qam + tem) * (a + tem))
    let ap = az + d * am
    let bp = bz + d * bm
    d = -(a + em) * (qab + em) * x / ((a + tem) * (qap + tem))
    let app = ap + d * az
    let bpp = bp + d * bz
    let aold = az

    if (bpp === 0) bpp = epsilon

    am = ap / bpp
    bm = bp / bpp
    az = app / bpp

    if (Math.abs(az - aold) < epsilon * Math.abs(az)) break
  }

  if (!isFinite(az)) return 1

  return az
}

export function getControlGroup(groups) {
  return groups.find((g) => g.isControl)
}

export function getExperimentGroups(groups) {
  return groups.filter((g) => !g.isControl)
}

export function hasSignificantResult(experiment) {
  if (!experiment || experiment.status !== EXPERIMENT_STATUS.RUNNING) return false

  return experiment.metrics.some((metricKey) => {
    const results = calculateSignificance(experiment, metricKey)
    return results.some((r) => r.isSignificant)
  })
}
