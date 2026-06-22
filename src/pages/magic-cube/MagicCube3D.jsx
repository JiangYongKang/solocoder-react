import { colorToHex } from './magicCubeCore.js'

const CUBIE_SIZE = 80
const CUBIE_GAP = 2

function getCubiePosition(x, y, z) {
  return {
    x: (x - 1) * (CUBIE_SIZE + CUBIE_GAP),
    y: (1 - y) * (CUBIE_SIZE + CUBIE_GAP),
    z: (z - 1) * (CUBIE_SIZE + CUBIE_GAP),
  }
}

function getFaceColor(faces, face, row, col) {
  return faces[face] ? colorToHex(faces[face][row][col]) : '#1a1a2e'
}

function getCubieFaceColors(faces, x, y, z) {
  return {
    front: z === 2 ? getFaceColor(faces, 'F', y, x) : null,
    back: z === 0 ? getFaceColor(faces, 'B', y, 2 - x) : null,
    right: x === 2 ? getFaceColor(faces, 'R', y, 2 - z) : null,
    left: x === 0 ? getFaceColor(faces, 'L', y, z) : null,
    top: y === 0 ? getFaceColor(faces, 'U', z, x) : null,
    bottom: y === 2 ? getFaceColor(faces, 'D', 2 - z, x) : null,
  }
}

function CubieFace({ position, color }) {
  if (!color) return null
  return (
    <div className={`cubie-face cubie-face-${position}`} style={{ background: color }}>
      <div
        className="cubie-face-inner"
        style={{ background: color }}
      />
    </div>
  )
}

function Cubie({ x, y, z, colors, rotation }) {
  const pos = getCubiePosition(x, y, z)
  const transformStyle = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) ${rotation || ''}`,
  }

  return (
    <div className="cubie" style={transformStyle}>
      <CubieFace position="front" color={colors.front} />
      <CubieFace position="back" color={colors.back} />
      <CubieFace position="right" color={colors.right} />
      <CubieFace position="left" color={colors.left} />
      <CubieFace position="top" color={colors.top} />
      <CubieFace position="bottom" color={colors.bottom} />
    </div>
  )
}

export default function MagicCube3D({ faces, viewRotation, animatingFace, animatingClockwise, animationProgress }) {
  const cubies = []

  let animationTransform = ''
  if (animatingFace && animationProgress < 1) {
    const angle = animatingClockwise
      ? -90 * animationProgress
      : 90 * animationProgress

    switch (animatingFace) {
      case 'F':
        animationTransform = `translateZ(${CUBIE_SIZE + CUBIE_GAP}px) rotateZ(${angle}deg) translateZ(${-CUBIE_SIZE - CUBIE_GAP}px)`
        break
      case 'B':
        animationTransform = `translateZ(${-CUBIE_SIZE - CUBIE_GAP}px) rotateZ(${-angle}deg) translateZ(${CUBIE_SIZE + CUBIE_GAP}px)`
        break
      case 'L':
        animationTransform = `translateX(${-CUBIE_SIZE - CUBIE_GAP}px) rotateY(${-angle}deg) translateX(${CUBIE_SIZE + CUBIE_GAP}px)`
        break
      case 'R':
        animationTransform = `translateX(${CUBIE_SIZE + CUBIE_GAP}px) rotateY(${angle}deg) translateX(${-CUBIE_SIZE - CUBIE_GAP}px)`
        break
      case 'U':
        animationTransform = `translateY(${-CUBIE_SIZE - CUBIE_GAP}px) rotateX(${-angle}deg) translateY(${CUBIE_SIZE + CUBIE_GAP}px)`
        break
      case 'D':
        animationTransform = `translateY(${CUBIE_SIZE + CUBIE_GAP}px) rotateX(${angle}deg) translateY(${-CUBIE_SIZE - CUBIE_GAP}px)`
        break
      default:
        animationTransform = ''
    }
  }

  function shouldAnimate(x, y, z) {
    if (!animatingFace || animationProgress >= 1) return false
    switch (animatingFace) {
      case 'F': return z === 2
      case 'B': return z === 0
      case 'L': return x === 0
      case 'R': return x === 2
      case 'U': return y === 0
      case 'D': return y === 2
      default: return false
    }
  }

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      for (let z = 0; z < 3; z++) {
        const colors = getCubieFaceColors(faces, x, y, z)
        const hasAnyFace = colors.front || colors.back || colors.right || colors.left || colors.top || colors.bottom

        if (hasAnyFace || (x !== 1 || y !== 1 || z !== 1)) {
          const rot = shouldAnimate(x, y, z) ? animationTransform : ''
          cubies.push(
            <Cubie
              key={`${x}-${y}-${z}`}
              x={x}
              y={y}
              z={z}
              colors={colors}
              rotation={rot}
            />
          )
        }
      }
    }
  }

  const cubeTransform = `rotateX(${viewRotation.x}deg) rotateY(${viewRotation.y}deg)`

  return (
    <div className="magic-cube-3d" style={{ transform: cubeTransform }}>
      {cubies}
    </div>
  )
}
