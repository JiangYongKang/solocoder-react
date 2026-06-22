import { FACE_COLORS, FACE_LETTERS, SCRAMBLE_STEPS } from './constants.js'

export const COLOR_WHITE = 'W'
export const COLOR_YELLOW = 'Y'
export const COLOR_RED = 'R'
export const COLOR_ORANGE = 'O'
export const COLOR_BLUE = 'B'
export const COLOR_GREEN = 'G'

export function createInitialFaces() {
  return {
    U: createFace(COLOR_WHITE),
    D: createFace(COLOR_YELLOW),
    F: createFace(COLOR_RED),
    B: createFace(COLOR_ORANGE),
    L: createFace(COLOR_BLUE),
    R: createFace(COLOR_GREEN),
  }
}

export function createFace(color) {
  return [
    [color, color, color],
    [color, color, color],
    [color, color, color],
  ]
}

export function cloneFaces(faces) {
  return {
    U: faces.U.map((row) => [...row]),
    D: faces.D.map((row) => [...row]),
    F: faces.F.map((row) => [...row]),
    B: faces.B.map((row) => [...row]),
    L: faces.L.map((row) => [...row]),
    R: faces.R.map((row) => [...row]),
  }
}

function rotateFaceClockwise(face) {
  const result = createFace(face[0][0])
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result[c][2 - r] = face[r][c]
    }
  }
  return result
}

function rotateFaceCounterClockwise(face) {
  const result = createFace(face[0][0])
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result[2 - c][r] = face[r][c]
    }
  }
  return result
}

export function rotateFace(faces, face, clockwise = true) {
  const newFaces = cloneFaces(faces)

  switch (face) {
    case 'F':
      return rotateFront(newFaces, clockwise)
    case 'B':
      return rotateBack(newFaces, clockwise)
    case 'L':
      return rotateLeft(newFaces, clockwise)
    case 'R':
      return rotateRight(newFaces, clockwise)
    case 'U':
      return rotateUp(newFaces, clockwise)
    case 'D':
      return rotateDown(newFaces, clockwise)
    default:
      return newFaces
  }
}

function rotateFront(faces, clockwise) {
  faces.F = clockwise ? rotateFaceClockwise(faces.F) : rotateFaceCounterClockwise(faces.F)

  if (clockwise) {
    const tmp = [faces.U[2][0], faces.U[2][1], faces.U[2][2]]
    faces.U[2][0] = faces.L[2][2]
    faces.U[2][1] = faces.L[1][2]
    faces.U[2][2] = faces.L[0][2]

    faces.L[0][2] = faces.D[0][0]
    faces.L[1][2] = faces.D[0][1]
    faces.L[2][2] = faces.D[0][2]

    faces.D[0][0] = faces.R[2][0]
    faces.D[0][1] = faces.R[1][0]
    faces.D[0][2] = faces.R[0][0]

    faces.R[0][0] = tmp[0]
    faces.R[1][0] = tmp[1]
    faces.R[2][0] = tmp[2]
  } else {
    const tmp = [faces.U[2][0], faces.U[2][1], faces.U[2][2]]
    faces.U[2][0] = faces.R[0][0]
    faces.U[2][1] = faces.R[1][0]
    faces.U[2][2] = faces.R[2][0]

    faces.R[0][0] = faces.D[0][2]
    faces.R[1][0] = faces.D[0][1]
    faces.R[2][0] = faces.D[0][0]

    faces.D[0][0] = faces.L[0][2]
    faces.D[0][1] = faces.L[1][2]
    faces.D[0][2] = faces.L[2][2]

    faces.L[0][2] = tmp[2]
    faces.L[1][2] = tmp[1]
    faces.L[2][2] = tmp[0]
  }

  return faces
}

function rotateBack(faces, clockwise) {
  faces.B = clockwise ? rotateFaceClockwise(faces.B) : rotateFaceCounterClockwise(faces.B)

  if (clockwise) {
    const tmp = [faces.U[0][0], faces.U[0][1], faces.U[0][2]]
    faces.U[0][0] = faces.R[0][2]
    faces.U[0][1] = faces.R[1][2]
    faces.U[0][2] = faces.R[2][2]

    faces.R[0][2] = faces.D[2][2]
    faces.R[1][2] = faces.D[2][1]
    faces.R[2][2] = faces.D[2][0]

    faces.D[2][0] = faces.L[0][0]
    faces.D[2][1] = faces.L[1][0]
    faces.D[2][2] = faces.L[2][0]

    faces.L[0][0] = tmp[2]
    faces.L[1][0] = tmp[1]
    faces.L[2][0] = tmp[0]
  } else {
    const tmp = [faces.U[0][0], faces.U[0][1], faces.U[0][2]]
    faces.U[0][0] = faces.L[2][0]
    faces.U[0][1] = faces.L[1][0]
    faces.U[0][2] = faces.L[0][0]

    faces.L[0][0] = faces.D[2][0]
    faces.L[1][0] = faces.D[2][1]
    faces.L[2][0] = faces.D[2][2]

    faces.D[2][0] = faces.R[2][2]
    faces.D[2][1] = faces.R[1][2]
    faces.D[2][2] = faces.R[0][2]

    faces.R[0][2] = tmp[0]
    faces.R[1][2] = tmp[1]
    faces.R[2][2] = tmp[2]
  }

  return faces
}

function rotateLeft(faces, clockwise) {
  faces.L = clockwise ? rotateFaceClockwise(faces.L) : rotateFaceCounterClockwise(faces.L)

  if (clockwise) {
    const tmp = [faces.U[0][0], faces.U[1][0], faces.U[2][0]]
    faces.U[0][0] = faces.B[2][2]
    faces.U[1][0] = faces.B[1][2]
    faces.U[2][0] = faces.B[0][2]

    faces.B[0][2] = faces.D[2][0]
    faces.B[1][2] = faces.D[1][0]
    faces.B[2][2] = faces.D[0][0]

    faces.D[0][0] = faces.F[0][0]
    faces.D[1][0] = faces.F[1][0]
    faces.D[2][0] = faces.F[2][0]

    faces.F[0][0] = tmp[0]
    faces.F[1][0] = tmp[1]
    faces.F[2][0] = tmp[2]
  } else {
    const tmp = [faces.U[0][0], faces.U[1][0], faces.U[2][0]]
    faces.U[0][0] = faces.F[0][0]
    faces.U[1][0] = faces.F[1][0]
    faces.U[2][0] = faces.F[2][0]

    faces.F[0][0] = faces.D[0][0]
    faces.F[1][0] = faces.D[1][0]
    faces.F[2][0] = faces.D[2][0]

    faces.D[0][0] = faces.B[2][2]
    faces.D[1][0] = faces.B[1][2]
    faces.D[2][0] = faces.B[0][2]

    faces.B[0][2] = tmp[2]
    faces.B[1][2] = tmp[1]
    faces.B[2][2] = tmp[0]
  }

  return faces
}

function rotateRight(faces, clockwise) {
  faces.R = clockwise ? rotateFaceClockwise(faces.R) : rotateFaceCounterClockwise(faces.R)

  if (clockwise) {
    const tmp = [faces.U[0][2], faces.U[1][2], faces.U[2][2]]
    faces.U[0][2] = faces.F[0][2]
    faces.U[1][2] = faces.F[1][2]
    faces.U[2][2] = faces.F[2][2]

    faces.F[0][2] = faces.D[0][2]
    faces.F[1][2] = faces.D[1][2]
    faces.F[2][2] = faces.D[2][2]

    faces.D[0][2] = faces.B[2][0]
    faces.D[1][2] = faces.B[1][0]
    faces.D[2][2] = faces.B[0][0]

    faces.B[0][0] = tmp[2]
    faces.B[1][0] = tmp[1]
    faces.B[2][0] = tmp[0]
  } else {
    const tmp = [faces.U[0][2], faces.U[1][2], faces.U[2][2]]
    faces.U[0][2] = faces.B[2][0]
    faces.U[1][2] = faces.B[1][0]
    faces.U[2][2] = faces.B[0][0]

    faces.B[0][0] = faces.D[2][2]
    faces.B[1][0] = faces.D[1][2]
    faces.B[2][0] = faces.D[0][2]

    faces.D[0][2] = faces.F[0][2]
    faces.D[1][2] = faces.F[1][2]
    faces.D[2][2] = faces.F[2][2]

    faces.F[0][2] = tmp[0]
    faces.F[1][2] = tmp[1]
    faces.F[2][2] = tmp[2]
  }

  return faces
}

function rotateUp(faces, clockwise) {
  faces.U = clockwise ? rotateFaceClockwise(faces.U) : rotateFaceCounterClockwise(faces.U)

  if (clockwise) {
    const tmp = [faces.F[0][0], faces.F[0][1], faces.F[0][2]]
    faces.F[0][0] = faces.R[0][0]
    faces.F[0][1] = faces.R[0][1]
    faces.F[0][2] = faces.R[0][2]

    faces.R[0][0] = faces.B[0][0]
    faces.R[0][1] = faces.B[0][1]
    faces.R[0][2] = faces.B[0][2]

    faces.B[0][0] = faces.L[0][0]
    faces.B[0][1] = faces.L[0][1]
    faces.B[0][2] = faces.L[0][2]

    faces.L[0][0] = tmp[0]
    faces.L[0][1] = tmp[1]
    faces.L[0][2] = tmp[2]
  } else {
    const tmp = [faces.F[0][0], faces.F[0][1], faces.F[0][2]]
    faces.F[0][0] = faces.L[0][0]
    faces.F[0][1] = faces.L[0][1]
    faces.F[0][2] = faces.L[0][2]

    faces.L[0][0] = faces.B[0][0]
    faces.L[0][1] = faces.B[0][1]
    faces.L[0][2] = faces.B[0][2]

    faces.B[0][0] = faces.R[0][0]
    faces.B[0][1] = faces.R[0][1]
    faces.B[0][2] = faces.R[0][2]

    faces.R[0][0] = tmp[0]
    faces.R[0][1] = tmp[1]
    faces.R[0][2] = tmp[2]
  }

  return faces
}

function rotateDown(faces, clockwise) {
  faces.D = clockwise ? rotateFaceClockwise(faces.D) : rotateFaceCounterClockwise(faces.D)

  if (clockwise) {
    const tmp = [faces.F[2][0], faces.F[2][1], faces.F[2][2]]
    faces.F[2][0] = faces.L[2][0]
    faces.F[2][1] = faces.L[2][1]
    faces.F[2][2] = faces.L[2][2]

    faces.L[2][0] = faces.B[2][0]
    faces.L[2][1] = faces.B[2][1]
    faces.L[2][2] = faces.B[2][2]

    faces.B[2][0] = faces.R[2][0]
    faces.B[2][1] = faces.R[2][1]
    faces.B[2][2] = faces.R[2][2]

    faces.R[2][0] = tmp[0]
    faces.R[2][1] = tmp[1]
    faces.R[2][2] = tmp[2]
  } else {
    const tmp = [faces.F[2][0], faces.F[2][1], faces.F[2][2]]
    faces.F[2][0] = faces.R[2][0]
    faces.F[2][1] = faces.R[2][1]
    faces.F[2][2] = faces.R[2][2]

    faces.R[2][0] = faces.B[2][0]
    faces.R[2][1] = faces.B[2][1]
    faces.R[2][2] = faces.B[2][2]

    faces.B[2][0] = faces.L[2][0]
    faces.B[2][1] = faces.L[2][1]
    faces.B[2][2] = faces.L[2][2]

    faces.L[2][0] = tmp[0]
    faces.L[2][1] = tmp[1]
    faces.L[2][2] = tmp[2]
  }

  return faces
}

export function isSolved(faces) {
  for (const face of Object.keys(faces)) {
    const color = faces[face][1][1]
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (faces[face][r][c] !== color) {
          return false
        }
      }
    }
  }
  return true
}

export function generateScramble(randomFn = Math.random) {
  const moves = []
  let lastFace = null

  for (let i = 0; i < SCRAMBLE_STEPS; i++) {
    let face
    do {
      face = FACE_LETTERS[Math.floor(randomFn() * FACE_LETTERS.length)]
    } while (face === lastFace)

    lastFace = face
    const clockwise = randomFn() < 0.5
    moves.push({ face, clockwise })
  }

  return moves
}

export function applyMoves(faces, moves) {
  let result = cloneFaces(faces)
  for (const move of moves) {
    result = rotateFace(result, move.face, move.clockwise)
  }
  return result
}

export function moveToString(move) {
  return move.clockwise ? move.face : move.face + "'"
}

export function movesToStrings(moves) {
  return moves.map(moveToString)
}

export function invertMove(move) {
  return { face: move.face, clockwise: !move.clockwise }
}

export function invertMoves(moves) {
  const result = []
  for (let i = moves.length - 1; i >= 0; i--) {
    result.push(invertMove(moves[i]))
  }
  return result
}

export function generateSolutionSteps(scrambleMoves) {
  return invertMoves(scrambleMoves)
}

export function colorToHex(color) {
  const map = {
    W: FACE_COLORS.U,
    Y: FACE_COLORS.D,
    R: FACE_COLORS.F,
    O: FACE_COLORS.B,
    B: FACE_COLORS.L,
    G: FACE_COLORS.R,
  }
  return map[color] || '#000000'
}

export function getFaceColor(faces, face, row, col) {
  return faces[face][row][col]
}
