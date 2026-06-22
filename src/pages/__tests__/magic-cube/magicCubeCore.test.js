import { describe, it, expect } from 'vitest'
import {
  createInitialFaces,
  createFace,
  cloneFaces,
  rotateFace,
  isSolved,
  generateScramble,
  applyMoves,
  moveToString,
  movesToStrings,
  invertMove,
  invertMoves,
  generateSolutionSteps,
  colorToHex,
  getFaceColor,
  COLOR_WHITE,
  COLOR_YELLOW,
  COLOR_RED,
  COLOR_ORANGE,
  COLOR_BLUE,
  COLOR_GREEN,
} from '@/pages/magic-cube/magicCubeCore.js'
import { FACE_COLORS, SCRAMBLE_STEPS } from '@/pages/magic-cube/constants.js'

function facesEqual(f1, f2) {
  for (const face of ['U', 'D', 'F', 'B', 'L', 'R']) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (f1[face][r][c] !== f2[face][r][c]) return false
      }
    }
  }
  return true
}

describe('magicCubeCore - Data Structure', () => {
  describe('createFace', () => {
    it('should create a 3x3 face filled with the given color', () => {
      const face = createFace(COLOR_RED)
      expect(face.length).toBe(3)
      face.forEach((row) => {
        expect(row.length).toBe(3)
        row.forEach((cell) => expect(cell).toBe(COLOR_RED))
      })
    })

    it('should handle different colors', () => {
      expect(createFace(COLOR_BLUE)[0][0]).toBe(COLOR_BLUE)
      expect(createFace(COLOR_GREEN)[2][2]).toBe(COLOR_GREEN)
    })
  })

  describe('createInitialFaces', () => {
    it('should create all 6 faces', () => {
      const faces = createInitialFaces()
      expect(Object.keys(faces).sort()).toEqual(['B', 'D', 'F', 'L', 'R', 'U'])
    })

    it('should assign correct colors to each face', () => {
      const faces = createInitialFaces()
      expect(faces.U[0][0]).toBe(COLOR_WHITE)
      expect(faces.D[0][0]).toBe(COLOR_YELLOW)
      expect(faces.F[0][0]).toBe(COLOR_RED)
      expect(faces.B[0][0]).toBe(COLOR_ORANGE)
      expect(faces.L[0][0]).toBe(COLOR_BLUE)
      expect(faces.R[0][0]).toBe(COLOR_GREEN)
    })

    it('each face should be uniformly colored', () => {
      const faces = createInitialFaces()
      for (const face of Object.keys(faces)) {
        const color = faces[face][1][1]
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            expect(faces[face][r][c]).toBe(color)
          }
        }
      }
    })
  })

  describe('cloneFaces', () => {
    it('should create a deep copy', () => {
      const original = createInitialFaces()
      const cloned = cloneFaces(original)
      expect(facesEqual(original, cloned)).toBe(true)

      cloned.U[0][0] = 'X'
      expect(original.U[0][0]).toBe(COLOR_WHITE)
    })

    it('should not share references', () => {
      const original = createInitialFaces()
      const cloned = cloneFaces(original)
      expect(original.U).not.toBe(cloned.U)
      expect(original.U[0]).not.toBe(cloned.U[0])
    })
  })

  describe('getFaceColor', () => {
    it('should return correct color for a position', () => {
      const faces = createInitialFaces()
      expect(getFaceColor(faces, 'F', 0, 0)).toBe(COLOR_RED)
      expect(getFaceColor(faces, 'U', 2, 2)).toBe(COLOR_WHITE)
    })
  })

  describe('colorToHex', () => {
    it('should convert color codes to hex values', () => {
      expect(colorToHex('W')).toBe(FACE_COLORS.U)
      expect(colorToHex('Y')).toBe(FACE_COLORS.D)
      expect(colorToHex('R')).toBe(FACE_COLORS.F)
      expect(colorToHex('O')).toBe(FACE_COLORS.B)
      expect(colorToHex('B')).toBe(FACE_COLORS.L)
      expect(colorToHex('G')).toBe(FACE_COLORS.R)
    })

    it('should return default for unknown color', () => {
      expect(colorToHex('X')).toBe('#000000')
    })
  })
})

describe('magicCubeCore - isSolved', () => {
  it('should return true for initial state', () => {
    expect(isSolved(createInitialFaces())).toBe(true)
  })

  it('should return false after a single rotation', () => {
    const faces = rotateFace(createInitialFaces(), 'F', true)
    expect(isSolved(faces)).toBe(false)
  })

  it('should return true after rotating a face 4 times', () => {
    let faces = createInitialFaces()
    for (let i = 0; i < 4; i++) {
      faces = rotateFace(faces, 'R', true)
    }
    expect(isSolved(faces)).toBe(true)
  })

  it('should return true after rotating clockwise then counter-clockwise', () => {
    let faces = createInitialFaces()
    faces = rotateFace(faces, 'U', true)
    faces = rotateFace(faces, 'U', false)
    expect(isSolved(faces)).toBe(true)
  })
})

describe('magicCubeCore - Face Rotations (Involution tests: 4 rotations = identity)', () => {
  const facesToTest = ['F', 'B', 'L', 'R', 'U', 'D']

  facesToTest.forEach((face) => {
    it(`4 clockwise rotations of ${face} should return to original state`, () => {
      const original = createInitialFaces()
      let result = createInitialFaces()
      for (let i = 0; i < 4; i++) {
        result = rotateFace(result, face, true)
      }
      expect(facesEqual(original, result)).toBe(true)
    })

    it(`4 counter-clockwise rotations of ${face} should return to original state`, () => {
      const original = createInitialFaces()
      let result = createInitialFaces()
      for (let i = 0; i < 4; i++) {
        result = rotateFace(result, face, false)
      }
      expect(facesEqual(original, result)).toBe(true)
    })

    it(`clockwise then counter-clockwise rotation of ${face} should cancel out`, () => {
      const original = createInitialFaces()
      let result = rotateFace(original, face, true)
      result = rotateFace(result, face, false)
      expect(facesEqual(original, result)).toBe(true)
    })

    it(`3 clockwise = 1 counter-clockwise for ${face}`, () => {
      let cw3 = createInitialFaces()
      for (let i = 0; i < 3; i++) cw3 = rotateFace(cw3, face, true)
      let ccw1 = rotateFace(createInitialFaces(), face, false)
      expect(facesEqual(cw3, ccw1)).toBe(true)
    })
  })
})

describe('magicCubeCore - Front face rotation details', () => {
  it('clockwise F should correctly move U front row to R left column', () => {
    const faces = createInitialFaces()
    const result = rotateFace(faces, 'F', true)

    expect(result.R[0][0]).toBe(COLOR_WHITE)
    expect(result.R[1][0]).toBe(COLOR_WHITE)
    expect(result.R[2][0]).toBe(COLOR_WHITE)
  })

  it('clockwise F should correctly move L right column to U front row', () => {
    const faces = createInitialFaces()
    const result = rotateFace(faces, 'F', true)

    expect(result.U[2][0]).toBe(COLOR_BLUE)
    expect(result.U[2][1]).toBe(COLOR_BLUE)
    expect(result.U[2][2]).toBe(COLOR_BLUE)
  })
})

describe('magicCubeCore - Center pieces never change', () => {
  it('center piece of each face should be invariant under any rotation', () => {
    const originalCenters = {
      U: createInitialFaces().U[1][1],
      D: createInitialFaces().D[1][1],
      F: createInitialFaces().F[1][1],
      B: createInitialFaces().B[1][1],
      L: createInitialFaces().L[1][1],
      R: createInitialFaces().R[1][1],
    }

    let faces = createInitialFaces()
    const allMoves = [
      ['F', true], ['B', true], ['L', true], ['R', true], ['U', true], ['D', true],
      ['F', false], ['B', false],
    ]

    for (const [face, cw] of allMoves) {
      faces = rotateFace(faces, face, cw)
      expect(faces.U[1][1]).toBe(originalCenters.U)
      expect(faces.D[1][1]).toBe(originalCenters.D)
      expect(faces.F[1][1]).toBe(originalCenters.F)
      expect(faces.B[1][1]).toBe(originalCenters.B)
      expect(faces.L[1][1]).toBe(originalCenters.L)
      expect(faces.R[1][1]).toBe(originalCenters.R)
    }
  })
})

describe('magicCubeCore - Scramble and Solution', () => {
  describe('generateScramble', () => {
    it('should generate exactly SCRAMBLE_STEPS moves', () => {
      const mockRandom = (() => {
        let counter = 0
        return () => {
          counter++
          return (counter % 6) / 6
        }
      })()
      const moves = generateScramble(mockRandom)
      expect(moves.length).toBe(SCRAMBLE_STEPS)
    })

    it('should generate valid face letters', () => {
      const moves = generateScramble()
      const validFaces = new Set(['F', 'B', 'L', 'R', 'U', 'D'])
      moves.forEach((move) => {
        expect(validFaces.has(move.face)).toBe(true)
        expect(typeof move.clockwise).toBe('boolean')
      })
    })

    it('should not have two consecutive moves on the same face', () => {
      const mockRandom = (() => {
        let counter = 0
        return () => {
          counter++
          return (counter % 6) / 6
        }
      })()
      const moves = generateScramble(mockRandom)
      for (let i = 1; i < moves.length; i++) {
        expect(moves[i].face).not.toBe(moves[i - 1].face)
      }
    })
  })

  describe('applyMoves', () => {
    it('should apply a sequence of moves', () => {
      const moves = [
        { face: 'F', clockwise: true },
        { face: 'R', clockwise: false },
      ]
      const result = applyMoves(createInitialFaces(), moves)
      const manual = rotateFace(rotateFace(createInitialFaces(), 'F', true), 'R', false)
      expect(facesEqual(result, manual)).toBe(true)
    })

    it('should handle empty move list', () => {
      const original = createInitialFaces()
      const result = applyMoves(original, [])
      expect(facesEqual(original, result)).toBe(true)
    })
  })

  describe('moveToString / movesToStrings', () => {
    it('should format clockwise as just the letter', () => {
      expect(moveToString({ face: 'F', clockwise: true })).toBe('F')
    })

    it('should format counter-clockwise with prime', () => {
      expect(moveToString({ face: 'U', clockwise: false })).toBe("U'")
    })

    it('should format a list of moves', () => {
      const moves = [
        { face: 'F', clockwise: true },
        { face: 'B', clockwise: false },
        { face: 'R', clockwise: true },
      ]
      expect(movesToStrings(moves)).toEqual(['F', "B'", 'R'])
    })
  })

  describe('invertMove / invertMoves', () => {
    it('should invert a single move (clockwise <-> counter)', () => {
      expect(invertMove({ face: 'F', clockwise: true })).toEqual({ face: 'F', clockwise: false })
      expect(invertMove({ face: 'R', clockwise: false })).toEqual({ face: 'R', clockwise: true })
    })

    it('should invert moves by reversing order and flipping direction', () => {
      const moves = [
        { face: 'F', clockwise: true },
        { face: 'R', clockwise: false },
        { face: 'U', clockwise: true },
      ]
      const inverted = invertMoves(moves)
      expect(inverted).toEqual([
        { face: 'U', clockwise: false },
        { face: 'R', clockwise: true },
        { face: 'F', clockwise: false },
      ])
    })

    it('applying moves then inverted moves returns to solved state', () => {
      const moves = generateScramble()
      const scrambled = applyMoves(createInitialFaces(), moves)
      const unscrambled = applyMoves(scrambled, invertMoves(moves))
      expect(isSolved(unscrambled)).toBe(true)
    })
  })

  describe('generateSolutionSteps', () => {
    it('should generate solution that undoes the scramble', () => {
      const scrambleMoves = generateScramble()
      const solutionMoves = generateSolutionSteps(scrambleMoves)

      const scrambled = applyMoves(createInitialFaces(), scrambleMoves)
      const solved = applyMoves(scrambled, solutionMoves)
      expect(isSolved(solved)).toBe(true)
    })

    it('solution should have same number of steps as scramble', () => {
      const scrambleMoves = generateScramble()
      const solutionMoves = generateSolutionSteps(scrambleMoves)
      expect(solutionMoves.length).toBe(scrambleMoves.length)
    })
  })
})

describe('magicCubeCore - Sequence tests', () => {
  it('commutator (F R F\' R\') x 6 should return to solved (3x3 identity)', () => {
    let faces = createInitialFaces()
    const commutator = [
      ['F', true], ['R', true], ['F', false], ['R', false],
    ]
    for (let cycle = 0; cycle < 6; cycle++) {
      for (const [face, cw] of commutator) {
        faces = rotateFace(faces, face, cw)
      }
    }
    expect(isSolved(faces)).toBe(true)
  })

  it('Sune algorithm (R U R\' U R U2 R\') x 6 should return to solved', () => {
    let faces = createInitialFaces()
    const sune = [
      ['R', true], ['U', true], ['R', false], ['U', true],
      ['R', true], ['U', true], ['U', true], ['R', false],
    ]
    for (let cycle = 0; cycle < 6; cycle++) {
      for (const [face, cw] of sune) {
        faces = rotateFace(faces, face, cw)
      }
    }
    expect(isSolved(faces)).toBe(true)
  })
})
