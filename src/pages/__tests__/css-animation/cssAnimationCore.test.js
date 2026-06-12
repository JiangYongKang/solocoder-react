import { ANIMATION_PROPERTIES, STORAGE_KEY } from '@/pages/css-animation/constants.js'
import {
    addKeyframe,
    addPropertyTrack,
    createAnimation,
    createKeyframe,
    createPropertyTrack,
    cubicBezierToString,
    deleteAnimationFromList,
    exportAnimationJSON,
    formatDate,
    formatValue,
    generateAnimationCSS,
    generateFullCSS,
    generateId,
    generateKeyframesCSS,
    getDominantEasing,
    getEasingAtTime,
    getSurroundingKeyframes,
    isColorProperty,
    isColorValue,
    loadAnimations,
    moveKeyframe,
    parseCubicBezier,
    removeKeyframe,
    removePropertyTrack,
    renameAnimationInList,
    saveAnimations,
    saveAnimationToList,
    toggleTrackVisibility,
    updateAnimationSettings,
    updateEasing,
    updateKeyframeValue,
    validateAnimationJSON,
} from '@/pages/css-animation/cssAnimationCore.js'
import { beforeEach, describe, expect, it } from 'vitest'

function createMockStorage() {
  const store = {}
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    _store: store,
  }
}

describe('cssAnimationCore', () => {
  describe('generateId', () => {
    it('should generate unique string IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(5)
      expect(id1).not.toBe(id2)
    })
  })

  describe('createKeyframe', () => {
    it('should create a keyframe with default easing', () => {
      const keyframe = createKeyframe(50, 100)
      expect(keyframe).toHaveProperty('id')
      expect(keyframe.time).toBe(50)
      expect(keyframe.value).toBe(100)
      expect(keyframe.easing).toBe('linear')
    })

    it('should create a keyframe with custom easing', () => {
      const keyframe = createKeyframe(25, 50, 'ease-in')
      expect(keyframe.easing).toBe('ease-in')
    })

    it('should round time to 2 decimal places', () => {
      const keyframe = createKeyframe(33.333333, 100)
      expect(keyframe.time).toBe(33.33)
    })
  })

  describe('createPropertyTrack', () => {
    it('should create a track for a valid property', () => {
      const track = createPropertyTrack('translateX')
      expect(track).toHaveProperty('id')
      expect(track.property).toBe('translateX')
      expect(track.visible).toBe(true)
      expect(track.unit).toBe('px')
      expect(track.keyframes).toHaveLength(2)
      expect(track.keyframes[0].time).toBe(0)
      expect(track.keyframes[0].value).toBe(ANIMATION_PROPERTIES.translateX.default)
      expect(track.keyframes[1].time).toBe(100)
    })

    it('should return null for invalid property', () => {
      const track = createPropertyTrack('invalid-property')
      expect(track).toBeNull()
    })
  })

  describe('createAnimation', () => {
    it('should create an animation with default values', () => {
      const animation = createAnimation('testAnimation')
      expect(animation).toHaveProperty('id')
      expect(animation.name).toBe('testAnimation')
      expect(animation.duration).toBe(2)
      expect(animation.playbackSpeed).toBe(1)
      expect(animation.iterations).toBe('infinite')
      expect(animation.direction).toBe('normal')
      expect(animation.fillMode).toBe('forwards')
      expect(animation.tracks.length).toBeGreaterThan(0)
      expect(animation).toHaveProperty('createdAt')
      expect(animation).toHaveProperty('updatedAt')
    })

    it('should use default name when not provided', () => {
      const animation = createAnimation()
      expect(animation.name).toBe('myAnimation')
    })
  })

  describe('addPropertyTrack', () => {
    it('should add a new property track', () => {
      const animation = createAnimation()
      const initialCount = animation.tracks.length
      const updated = addPropertyTrack(animation, 'scale')
      expect(updated.tracks.length).toBe(initialCount + 1)
      expect(updated.tracks.some((t) => t.property === 'scale')).toBe(true)
    })

    it('should not add duplicate property track', () => {
      const animation = createAnimation()
      const translateXTrack = animation.tracks.find((t) => t.property === 'translateX')
      expect(translateXTrack).toBeDefined()
      const updated = addPropertyTrack(animation, 'translateX')
      expect(updated).toBe(animation)
    })

    it('should not modify original animation', () => {
      const animation = createAnimation()
      const initialTracks = [...animation.tracks]
      addPropertyTrack(animation, 'scale')
      expect(animation.tracks).toEqual(initialTracks)
    })
  })

  describe('removePropertyTrack', () => {
    it('should remove a property track', () => {
      const animation = createAnimation()
      const trackToRemove = animation.tracks[0]
      const initialCount = animation.tracks.length
      const updated = removePropertyTrack(animation, trackToRemove.id)
      expect(updated.tracks.length).toBe(initialCount - 1)
      expect(updated.tracks.some((t) => t.id === trackToRemove.id)).toBe(false)
    })

    it('should not remove when only one track exists', () => {
      const animation = {
        ...createAnimation(),
        tracks: [createPropertyTrack('translateX')],
      }
      const trackId = animation.tracks[0].id
      const updated = removePropertyTrack(animation, trackId)
      expect(updated.tracks.length).toBe(1)
    })

    it('should return same animation for non-existent track', () => {
      const animation = createAnimation()
      const updated = removePropertyTrack(animation, 'non-existent-id')
      expect(updated).toBe(animation)
    })
  })

  describe('toggleTrackVisibility', () => {
    it('should toggle track visibility from true to false', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      expect(animation.tracks[0].visible).toBe(true)
      const updated = toggleTrackVisibility(animation, trackId)
      expect(updated.tracks.find((t) => t.id === trackId).visible).toBe(false)
    })

    it('should toggle track visibility from false to true', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const hidden = toggleTrackVisibility(animation, trackId)
      const shown = toggleTrackVisibility(hidden, trackId)
      expect(shown.tracks.find((t) => t.id === trackId).visible).toBe(true)
    })
  })

  describe('addKeyframe', () => {
    it('should add a keyframe at specified time', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const updated = addKeyframe(animation, trackId, 50)
      const track = updated.tracks.find((t) => t.id === trackId)
      expect(track.keyframes.length).toBe(3)
      expect(track.keyframes.some((k) => k.time === 50)).toBe(true)
    })

    it('should not add duplicate keyframe at same time', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const updated = addKeyframe(animation, trackId, 0)
      const track = updated.tracks.find((t) => t.id === trackId)
      expect(track.keyframes.length).toBe(2)
    })

    it('should clamp time between 0 and 100', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const updated = addKeyframe(animation, trackId, 150)
      const track = updated.tracks.find((t) => t.id === trackId)
      expect(track.keyframes.some((k) => k.time === 100)).toBe(true)
      expect(track.keyframes.length).toBe(2)
    })

    it('should sort keyframes by time', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      let updated = addKeyframe(animation, trackId, 75)
      updated = addKeyframe(updated, trackId, 25)
      const track = updated.tracks.find((t) => t.id === trackId)
      const times = track.keyframes.map((k) => k.time)
      expect(times).toEqual([0, 25, 75, 100])
    })
  })

  describe('removeKeyframe', () => {
    it('should remove a keyframe', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const withKeyframe = addKeyframe(animation, trackId, 50)
      const keyframeId = withKeyframe.tracks[0].keyframes.find((k) => k.time === 50).id
      const updated = removeKeyframe(withKeyframe, trackId, keyframeId)
      const track = updated.tracks.find((t) => t.id === trackId)
      expect(track.keyframes.length).toBe(2)
      expect(track.keyframes.some((k) => k.id === keyframeId)).toBe(false)
    })

    it('should not remove 0% keyframe', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes.find((k) => k.time === 0).id
      const updated = removeKeyframe(animation, trackId, keyframeId)
      expect(updated).toBe(animation)
    })

    it('should not remove 100% keyframe', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes.find((k) => k.time === 100).id
      const updated = removeKeyframe(animation, trackId, keyframeId)
      expect(updated).toBe(animation)
    })

    it('should not remove when only 2 keyframes exist', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes[0].id
      const updated = removeKeyframe(animation, trackId, keyframeId)
      expect(updated).toBe(animation)
    })
  })

  describe('updateKeyframeValue', () => {
    it('should update keyframe value', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes[0].id
      const updated = updateKeyframeValue(animation, trackId, keyframeId, 999)
      const keyframe = updated.tracks
        .find((t) => t.id === trackId)
        .keyframes.find((k) => k.id === keyframeId)
      expect(keyframe.value).toBe(999)
    })

    it('should not modify original animation', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes[0].id
      const originalValue = animation.tracks[0].keyframes[0].value
      updateKeyframeValue(animation, trackId, keyframeId, 999)
      expect(animation.tracks[0].keyframes[0].value).toBe(originalValue)
    })
  })

  describe('moveKeyframe', () => {
    it('should move keyframe to new time', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const withKeyframe = addKeyframe(animation, trackId, 25)
      const keyframeId = withKeyframe.tracks[0].keyframes.find((k) => k.time === 25).id
      const updated = moveKeyframe(withKeyframe, trackId, keyframeId, 75)
      const keyframe = updated.tracks
        .find((t) => t.id === trackId)
        .keyframes.find((k) => k.id === keyframeId)
      expect(keyframe.time).toBe(75)
    })

    it('should not move 0% keyframe', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes.find((k) => k.time === 0).id
      const updated = moveKeyframe(animation, trackId, keyframeId, 50)
      const keyframe = updated.tracks
        .find((t) => t.id === trackId)
        .keyframes.find((k) => k.id === keyframeId)
      expect(keyframe.time).toBe(0)
    })

    it('should not move to conflicting time', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const withKeyframe = addKeyframe(animation, trackId, 25)
      const keyframeId = withKeyframe.tracks[0].keyframes.find((k) => k.time === 25).id
      const updated = moveKeyframe(withKeyframe, trackId, keyframeId, 100)
      expect(updated).toBe(withKeyframe)
    })

    it('should maintain sorted order after move', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      let updated = addKeyframe(animation, trackId, 25)
      updated = addKeyframe(updated, trackId, 75)
      const keyframeId = updated.tracks[0].keyframes.find((k) => k.time === 75).id
      updated = moveKeyframe(updated, trackId, keyframeId, 50)
      const track = updated.tracks.find((t) => t.id === trackId)
      const times = track.keyframes.map((k) => k.time)
      expect(times).toEqual([0, 25, 50, 100])
    })
  })

  describe('updateEasing', () => {
    it('should update easing for a keyframe', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const keyframeId = animation.tracks[0].keyframes[0].id
      const updated = updateEasing(animation, trackId, keyframeId, 'ease-in-out')
      const keyframe = updated.tracks
        .find((t) => t.id === trackId)
        .keyframes.find((k) => k.id === keyframeId)
      expect(keyframe.easing).toBe('ease-in-out')
    })
  })

  describe('getSurroundingKeyframes', () => {
    it('should return surrounding keyframes', () => {
      const animation = createAnimation()
      const trackId = animation.tracks[0].id
      const updated = addKeyframe(animation, trackId, 50)
      const track = updated.tracks.find((t) => t.id === trackId)
      const middleKeyframe = track.keyframes.find((k) => k.time === 50)
      const result = getSurroundingKeyframes(track, middleKeyframe.id)
      expect(result.prev.time).toBe(0)
      expect(result.current.time).toBe(50)
      expect(result.next.time).toBe(100)
    })

    it('should return null prev for first keyframe', () => {
      const animation = createAnimation()
      const track = animation.tracks[0]
      const firstKeyframe = track.keyframes.find((k) => k.time === 0)
      const result = getSurroundingKeyframes(track, firstKeyframe.id)
      expect(result.prev).toBeNull()
      expect(result.current.time).toBe(0)
      expect(result.next.time).toBe(100)
    })

    it('should return null next for last keyframe', () => {
      const animation = createAnimation()
      const track = animation.tracks[0]
      const lastKeyframe = track.keyframes.find((k) => k.time === 100)
      const result = getSurroundingKeyframes(track, lastKeyframe.id)
      expect(result.prev.time).toBe(0)
      expect(result.current.time).toBe(100)
      expect(result.next).toBeNull()
    })

    it('should return null for non-existent keyframe', () => {
      const animation = createAnimation()
      const track = animation.tracks[0]
      const result = getSurroundingKeyframes(track, 'non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('updateAnimationSettings', () => {
    it('should update multiple settings', () => {
      const animation = createAnimation()
      const updated = updateAnimationSettings(animation, {
        duration: 3,
        iterations: 5,
        direction: 'alternate',
      })
      expect(updated.duration).toBe(3)
      expect(updated.iterations).toBe(5)
      expect(updated.direction).toBe('alternate')
    })

    it('should update updatedAt timestamp', () => {
      const animation = createAnimation()
      const originalUpdatedAt = animation.updatedAt
      const updated = updateAnimationSettings(animation, { duration: 3 })
      expect(updated.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt)
    })
  })

  describe('CSS generation', () => {
    let testAnimation

    beforeEach(() => {
      testAnimation = {
        ...createAnimation('testAnim'),
        tracks: [
          {
            id: 'track1',
            property: 'translateX',
            visible: true,
            unit: 'px',
            keyframes: [
              { id: 'k1', time: 0, value: 0, easing: 'linear' },
              { id: 'k2', time: 50, value: 100, easing: 'ease-in' },
              { id: 'k3', time: 100, value: 0, easing: 'linear' },
            ],
          },
          {
            id: 'track2',
            property: 'opacity',
            visible: true,
            unit: '',
            keyframes: [
              { id: 'k4', time: 0, value: 1, easing: 'linear' },
              { id: 'k5', time: 100, value: 0, easing: 'linear' },
            ],
          },
        ],
      }
    })

    describe('generateKeyframesCSS', () => {
      it('should generate valid @keyframes CSS', () => {
        const css = generateKeyframesCSS(testAnimation)
        expect(css).toContain('@keyframes testAnim')
        expect(css).toContain('0%')
        expect(css).toContain('50%')
        expect(css).toContain('100%')
        expect(css).toContain('transform: translateX(0px)')
        expect(css).toContain('transform: translateX(100px)')
        expect(css).toContain('opacity: 1')
        expect(css).toContain('opacity: 0')
      })

      it('should use custom animation name', () => {
        const css = generateKeyframesCSS(testAnimation, 'customName')
        expect(css).toContain('@keyframes customName')
      })

      it('should not include hidden tracks', () => {
        const hiddenAnim = {
          ...testAnimation,
          tracks: testAnimation.tracks.map((t) =>
            t.property === 'opacity' ? { ...t, visible: false } : t
          ),
        }
        const css = generateKeyframesCSS(hiddenAnim)
        expect(css).not.toContain('opacity')
        expect(css).toContain('translateX')
      })

      it('should return empty string for no visible tracks', () => {
        const hiddenAnim = {
          ...testAnimation,
          tracks: testAnimation.tracks.map((t) => ({ ...t, visible: false })),
        }
        const css = generateKeyframesCSS(hiddenAnim)
        expect(css).toBe('')
      })

      it('should format background-color hex values without appending unit', () => {
        const colorAnim = {
          ...createAnimation('colorAnim'),
          tracks: [
            {
              id: 'colorTrack',
              property: 'background-color',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'ck1', time: 0, value: '#ff0000', easing: 'linear' },
                { id: 'ck2', time: 100, value: '#00ff00', easing: 'linear' },
              ],
            },
          ],
        }
        const css = generateKeyframesCSS(colorAnim)
        expect(css).toContain('background-color: #ff0000')
        expect(css).toContain('background-color: #00ff00')
        expect(css).not.toContain('background-color: #ff0000px')
        expect(css).not.toContain('background-color: #00ff00px')
      })

      it('should format color values with short hex codes correctly', () => {
        const colorAnim = {
          ...createAnimation('shortHex'),
          tracks: [
            {
              id: 'colorTrack',
              property: 'background-color',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'ck1', time: 0, value: '#f00', easing: 'linear' },
                { id: 'ck2', time: 100, value: '#0f0', easing: 'linear' },
              ],
            },
          ],
        }
        const css = generateKeyframesCSS(colorAnim)
        expect(css).toContain('background-color: #f00')
        expect(css).toContain('background-color: #0f0')
        expect(css).not.toContain('undefined')
      })

      it('should handle mixed color and numeric properties in same animation', () => {
        const mixedAnim = {
          ...createAnimation('mixedAnim'),
          tracks: [
            {
              id: 't1',
              property: 'background-color',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'k1', time: 0, value: '#4a90d9', easing: 'linear' },
                { id: 'k2', time: 100, value: '#e94560', easing: 'linear' },
              ],
            },
            {
              id: 't2',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k3', time: 0, value: 0, easing: 'linear' },
                { id: 'k4', time: 100, value: 100, easing: 'linear' },
              ],
            },
            {
              id: 't3',
              property: 'opacity',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'k5', time: 0, value: 1, easing: 'linear' },
                { id: 'k6', time: 100, value: 0.5, easing: 'linear' },
              ],
            },
          ],
        }
        const css = generateKeyframesCSS(mixedAnim)
        expect(css).toContain('background-color: #4a90d9')
        expect(css).toContain('background-color: #e94560')
        expect(css).toContain('translateX(0px)')
        expect(css).toContain('translateX(100px)')
        expect(css).toContain('opacity: 1')
        expect(css).toContain('opacity: 0.5')
        expect(css).not.toContain('#4a90d9px')
        expect(css).not.toContain('#e94560px')
      })

      it('should interpolate color values by returning the from value', () => {
        const colorAnim = {
          ...createAnimation('interpColor'),
          tracks: [
            {
              id: 'colorTrack',
              property: 'background-color',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'ck1', time: 0, value: '#ff0000', easing: 'linear' },
                { id: 'ck2', time: 100, value: '#0000ff', easing: 'linear' },
              ],
            },
            {
              id: 'numTrack',
              property: 'opacity',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'nk1', time: 0, value: 1, easing: 'linear' },
                { id: 'nk3', time: 100, value: 0, easing: 'linear' },
              ],
            },
          ],
        }
        const css = generateKeyframesCSS(colorAnim)
        expect(css).toContain('background-color: #ff0000')
        expect(css).toContain('background-color: #0000ff')
        expect(css).toContain('opacity: 1')
        expect(css).toContain('opacity: 0')
      })
    })

    describe('generateAnimationCSS', () => {
      it('should generate animation shorthand CSS', () => {
        const css = generateAnimationCSS(testAnimation)
        expect(css).toContain('.animated-element')
        expect(css).toContain('animation:')
        expect(css).toContain('testAnim')
        expect(css).toContain('2s')
        expect(css).toContain('infinite')
      })

      it('should use the common easing when all keyframes use the same easing', () => {
        const sameEasingAnim = {
          ...createAnimation('sameEasing'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'ease-in-out' },
                { id: 'k2', time: 100, value: 100, easing: 'ease-in-out' },
              ],
            },
            {
              id: 't2',
              property: 'opacity',
              visible: true,
              unit: '',
              keyframes: [
                { id: 'k3', time: 0, value: 1, easing: 'ease-in-out' },
                { id: 'k4', time: 100, value: 0, easing: 'ease-in-out' },
              ],
            },
          ],
        }
        const css = generateAnimationCSS(sameEasingAnim)
        expect(css).toContain('ease-in-out')
        expect(css).not.toContain('linear')
      })

      it('should use ease as fallback when keyframes have different easings', () => {
        const mixedEasingAnim = {
          ...createAnimation('mixedEasing'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'ease-in' },
                { id: 'k2', time: 50, value: 50, easing: 'ease-out' },
                { id: 'k3', time: 100, value: 100, easing: 'linear' },
              ],
            },
          ],
        }
        const css = generateAnimationCSS(mixedEasingAnim)
        expect(css).toContain('ease')
        expect(css).not.toContain('ease-in')
        expect(css).not.toContain('ease-out')
      })

      it('should only consider visible tracks for easing', () => {
        const animWithHiddenTrack = {
          ...createAnimation('hiddenEasing'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'linear' },
                { id: 'k2', time: 100, value: 100, easing: 'linear' },
              ],
            },
            {
              id: 't2',
              property: 'opacity',
              visible: false,
              unit: '',
              keyframes: [
                { id: 'k3', time: 0, value: 1, easing: 'ease-in' },
                { id: 'k4', time: 100, value: 0, easing: 'ease-in' },
              ],
            },
          ],
        }
        const css = generateAnimationCSS(animWithHiddenTrack)
        expect(css).toContain('linear')
      })

      it('should use ease when no visible tracks exist', () => {
        const noVisibleAnim = {
          ...createAnimation('noVisible'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: false,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'ease-in' },
                { id: 'k2', time: 100, value: 100, easing: 'ease-in' },
              ],
            },
          ],
        }
        const css = generateAnimationCSS(noVisibleAnim)
        expect(css).toContain('ease')
      })
    })

    describe('generateFullCSS', () => {
      it('should generate complete CSS', () => {
        const css = generateFullCSS(testAnimation)
        expect(css).toContain('@keyframes')
        expect(css).toContain('.animated-element')
      })
    })
  })

  describe('localStorage persistence', () => {
    let storage

    beforeEach(() => {
      storage = createMockStorage()
    })

    it('loadAnimations should return empty array when no data', () => {
      expect(loadAnimations(storage)).toEqual([])
    })

    it('saveAnimations and loadAnimations should round-trip', () => {
      const animation = createAnimation('test')
      saveAnimations([animation], storage)
      const loaded = loadAnimations(storage)
      expect(Array.isArray(loaded)).toBe(true)
      expect(loaded.length).toBe(1)
      expect(loaded[0].name).toBe('test')
    })

    it('loadAnimations should return empty array for invalid JSON', () => {
      storage.setItem(STORAGE_KEY, 'not-json')
      expect(loadAnimations(storage)).toEqual([])
    })

    it('loadAnimations should return empty array for non-array data', () => {
      storage.setItem(STORAGE_KEY, JSON.stringify({ not: 'array' }))
      expect(loadAnimations(storage)).toEqual([])
    })

    it('should not throw when storage is null', () => {
      expect(() => saveAnimations([], null)).not.toThrow()
      expect(() => loadAnimations(null)).not.toThrow()
    })
  })

  describe('animation list management', () => {
    it('saveAnimationToList should add new animation', () => {
      const anim1 = createAnimation('anim1')
      const anim2 = createAnimation('anim2')
      const list = saveAnimationToList([anim1], anim2)
      expect(list.length).toBe(2)
      expect(list[0].id).toBe(anim2.id)
    })

    it('saveAnimationToList should update existing animation', () => {
      const anim = createAnimation('anim1')
      const list = saveAnimationToList([], anim)
      const updatedAnim = { ...anim, name: 'updated' }
      const updatedList = saveAnimationToList(list, updatedAnim)
      expect(updatedList.length).toBe(1)
      expect(updatedList[0].name).toBe('updated')
    })

    it('saveAnimationToList should respect max count', () => {
      let list = []
      for (let i = 0; i < 25; i++) {
        list = saveAnimationToList(list, createAnimation(`anim${i}`), 5)
      }
      expect(list.length).toBe(5)
    })

    it('deleteAnimationFromList should remove animation', () => {
      const anim1 = createAnimation('anim1')
      const anim2 = createAnimation('anim2')
      const list = [anim1, anim2]
      const updated = deleteAnimationFromList(list, anim1.id)
      expect(updated.length).toBe(1)
      expect(updated[0].id).toBe(anim2.id)
    })

    it('renameAnimationInList should rename animation', () => {
      const anim = createAnimation('oldName')
      const list = [anim]
      const updated = renameAnimationInList(list, anim.id, 'newName')
      expect(updated[0].name).toBe('newName')
    })
  })

  describe('JSON import/export', () => {
    it('exportAnimationJSON should return valid JSON string', () => {
      const animation = createAnimation('test')
      const json = exportAnimationJSON(animation)
      expect(typeof json).toBe('string')
      const parsed = JSON.parse(json)
      expect(parsed.name).toBe('test')
    })

    describe('validateAnimationJSON', () => {
      it('should validate correct animation JSON', () => {
        const animation = createAnimation('test')
        const json = exportAnimationJSON(animation)
        const result = validateAnimationJSON(json)
        expect(result.valid).toBe(true)
        expect(result.data).toBeDefined()
      })

      it('should reject invalid JSON syntax', () => {
        const result = validateAnimationJSON('not-json')
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })

      it('should reject non-object data', () => {
        const result = validateAnimationJSON('"not an object"')
        expect(result.valid).toBe(false)
      })

      it('should reject missing id', () => {
        const animation = { ...createAnimation(), id: undefined }
        delete animation.id
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject missing name', () => {
        const animation = { ...createAnimation(), name: undefined }
        delete animation.name
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject non-array tracks', () => {
        const animation = { ...createAnimation(), tracks: 'not-array' }
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject empty tracks', () => {
        const animation = { ...createAnimation(), tracks: [] }
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject invalid property', () => {
        const animation = {
          ...createAnimation(),
          tracks: [
            {
              ...createPropertyTrack('translateX'),
              property: 'invalid-property',
            },
          ],
        }
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject track with insufficient keyframes', () => {
        const track = createPropertyTrack('translateX')
        track.keyframes = track.keyframes.slice(0, 1)
        const animation = { ...createAnimation(), tracks: [track] }
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject track missing 0% keyframe', () => {
        const track = createPropertyTrack('translateX')
        track.keyframes = track.keyframes.filter((k) => k.time !== 0)
        track.keyframes.push({ id: 'test', time: 50, value: 0, easing: 'linear' })
        const animation = { ...createAnimation(), tracks: [track] }
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })

      it('should reject track missing 100% keyframe', () => {
        const track = createPropertyTrack('translateX')
        track.keyframes = track.keyframes.filter((k) => k.time !== 100)
        track.keyframes.push({ id: 'test', time: 50, value: 0, easing: 'linear' })
        const animation = { ...createAnimation(), tracks: [track] }
        const result = validateAnimationJSON(JSON.stringify(animation))
        expect(result.valid).toBe(false)
      })
    })
  })

  describe('cubic bezier functions', () => {
    it('cubicBezierToString should format correctly', () => {
      const result = cubicBezierToString(0.25, 0.1, 0.25, 1)
      expect(result).toBe('cubic-bezier(0.25, 0.1, 0.25, 1)')
    })

    it('parseCubicBezier should parse valid string', () => {
      const result = parseCubicBezier('cubic-bezier(0.25, 0.1, 0.25, 1)')
      expect(result).toEqual({ p1x: 0.25, p1y: 0.1, p2x: 0.25, p2y: 1 })
    })

    it('parseCubicBezier should return null for non-bezier string', () => {
      expect(parseCubicBezier('linear')).toBeNull()
      expect(parseCubicBezier('ease-in-out')).toBeNull()
    })

    it('parseCubicBezier should return null for invalid format', () => {
      expect(parseCubicBezier('cubic-bezier(0, 0)')).toBeNull()
      expect(parseCubicBezier('cubic-bezier(a, b, c, d)')).toBeNull()
    })

    it('parseCubicBezier should validate x range', () => {
      expect(parseCubicBezier('cubic-bezier(-0.1, 0.5, 0.5, 0.5)')).toBeNull()
      expect(parseCubicBezier('cubic-bezier(1.1, 0.5, 0.5, 0.5)')).toBeNull()
      expect(parseCubicBezier('cubic-bezier(0.5, 0.5, -0.1, 0.5)')).toBeNull()
      expect(parseCubicBezier('cubic-bezier(0.5, 0.5, 1.1, 0.5)')).toBeNull()
    })

    it('parseCubicBezier should allow y outside 0-1 range', () => {
      const result = parseCubicBezier('cubic-bezier(0.5, -0.5, 0.5, 1.5)')
      expect(result).toEqual({ p1x: 0.5, p1y: -0.5, p2x: 0.5, p2y: 1.5 })
    })
  })

  describe('formatDate', () => {
    it('should format timestamp correctly', () => {
      const timestamp = new Date('2024-01-15T14:30:00').getTime()
      const result = formatDate(timestamp)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
      expect(result).toContain('2024-01-15')
      expect(result).toContain('14:30')
    })

    it('should pad single digits with zero', () => {
      const timestamp = new Date('2024-01-05T09:05:00').getTime()
      const result = formatDate(timestamp)
      expect(result).toContain('01-05')
      expect(result).toContain('09:05')
    })
  })

  describe('color value detection', () => {
    describe('isColorValue', () => {
      it('should detect hex color codes', () => {
        expect(isColorValue('#ff0000')).toBe(true)
        expect(isColorValue('#FF0000')).toBe(true)
        expect(isColorValue('#f00')).toBe(true)
        expect(isColorValue('#abc123')).toBe(true)
      })

      it('should detect rgb/rgba color codes', () => {
        expect(isColorValue('rgb(255, 0, 0)')).toBe(true)
        expect(isColorValue('rgba(255, 0, 0, 0.5)')).toBe(true)
        expect(isColorValue('RGB(255,0,0)')).toBe(true)
      })

      it('should detect hsl/hsla color codes', () => {
        expect(isColorValue('hsl(120, 100%, 50%)')).toBe(true)
        expect(isColorValue('hsla(120, 100%, 50%, 0.3)')).toBe(true)
      })

      it('should return false for non-color values', () => {
        expect(isColorValue(100)).toBe(false)
        expect(isColorValue(0)).toBe(false)
        expect(isColorValue('100px')).toBe(false)
        expect(isColorValue('50%')).toBe(false)
        expect(isColorValue('linear')).toBe(false)
        expect(isColorValue('')).toBe(false)
        expect(isColorValue(null)).toBe(false)
        expect(isColorValue(undefined)).toBe(false)
      })

      it('should handle values with whitespace', () => {
        expect(isColorValue('  #ff0000  ')).toBe(true)
      })
    })

    describe('isColorProperty', () => {
      it('should recognize background-color as color property', () => {
        expect(isColorProperty('background-color')).toBe(true)
      })

      it('should return false for non-color properties', () => {
        expect(isColorProperty('translateX')).toBe(false)
        expect(isColorProperty('opacity')).toBe(false)
        expect(isColorProperty('scale')).toBe(false)
        expect(isColorProperty('width')).toBe(false)
        expect(isColorProperty('')).toBe(false)
        expect(isColorProperty(null)).toBe(false)
        expect(isColorProperty(undefined)).toBe(false)
      })
    })
  })

  describe('formatValue', () => {
    it('should format numeric values with unit', () => {
      expect(formatValue(100, 'px', 'translateX')).toBe('100px')
      expect(formatValue(50, '%', 'translateY')).toBe('50%')
      expect(formatValue(90, 'deg', 'rotate')).toBe('90deg')
    })

    it('should format numeric values without unit', () => {
      expect(formatValue(1, '', 'opacity')).toBe('1')
      expect(formatValue(0.5, '', 'opacity')).toBe('0.5')
      expect(formatValue(2, '', 'scale')).toBe('2')
    })

    it('should format color values by property name', () => {
      expect(formatValue('#ff0000', '', 'background-color')).toBe('#ff0000')
      expect(formatValue('#f00', '', 'background-color')).toBe('#f00')
    })

    it('should format color values by value detection even if unit exists', () => {
      expect(formatValue('#ff0000', 'px', 'background-color')).toBe('#ff0000')
      expect(formatValue('rgb(255,0,0)', 'px', 'background-color')).toBe('rgb(255,0,0)')
    })

    it('should handle edge cases safely', () => {
      expect(formatValue(0, 'px', 'translateX')).toBe('0px')
      expect(formatValue(null, '', 'opacity')).toBe('null')
      expect(formatValue(undefined, '', 'opacity')).toBe('undefined')
      expect(formatValue('', 'px', 'width')).toBe('')
    })
  })

  describe('easing functions', () => {
    describe('getDominantEasing', () => {
      it('should return ease when no visible tracks', () => {
        const anim = {
          ...createAnimation(),
          tracks: [
            { ...createPropertyTrack('translateX'), visible: false },
          ],
        }
        expect(getDominantEasing(anim)).toBe('ease')
      })

      it('should return ease when no tracks exist', () => {
        const anim = { ...createAnimation(), tracks: [] }
        expect(getDominantEasing(anim)).toBe('ease')
      })

      it('should return the single easing when all keyframes use same easing', () => {
        const anim = {
          ...createAnimation('test'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'ease-in-out' },
                { id: 'k2', time: 50, value: 50, easing: 'ease-in-out' },
                { id: 'k3', time: 100, value: 100, easing: 'ease-in-out' },
              ],
            },
          ],
        }
        expect(getDominantEasing(anim)).toBe('ease-in-out')
      })

      it('should ignore keyframes at time 100 when collecting easings', () => {
        const anim = {
          ...createAnimation('test'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'linear' },
                { id: 'k2', time: 100, value: 100, easing: 'should-be-ignored' },
              ],
            },
          ],
        }
        expect(getDominantEasing(anim)).toBe('linear')
      })

      it('should return ease when keyframes have mixed easings', () => {
        const anim = {
          ...createAnimation('test'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'ease-in' },
                { id: 'k2', time: 50, value: 50, easing: 'ease-out' },
                { id: 'k3', time: 100, value: 100, easing: 'linear' },
              ],
            },
          ],
        }
        expect(getDominantEasing(anim)).toBe('ease')
      })

      it('should only consider visible tracks', () => {
        const anim = {
          ...createAnimation('test'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'linear' },
                { id: 'k2', time: 100, value: 100, easing: 'linear' },
              ],
            },
            {
              id: 't2',
              property: 'opacity',
              visible: false,
              unit: '',
              keyframes: [
                { id: 'k3', time: 0, value: 1, easing: 'ease-in' },
                { id: 'k4', time: 100, value: 0, easing: 'ease-in' },
              ],
            },
          ],
        }
        expect(getDominantEasing(anim)).toBe('linear')
      })

      it('should handle cubic-bezier easing values', () => {
        const anim = {
          ...createAnimation('test'),
          tracks: [
            {
              id: 't1',
              property: 'translateX',
              visible: true,
              unit: 'px',
              keyframes: [
                { id: 'k1', time: 0, value: 0, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
                { id: 'k2', time: 100, value: 100, easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' },
              ],
            },
          ],
        }
        expect(getDominantEasing(anim)).toBe('cubic-bezier(0.25, 0.1, 0.25, 1)')
      })
    })

    describe('getEasingAtTime', () => {
      it('should return null when no matching keyframes at given time', () => {
        const tracks = [
          {
            id: 't1',
            keyframes: [
              { id: 'k1', time: 0, value: 0, easing: 'linear' },
              { id: 'k2', time: 100, value: 100, easing: 'linear' },
            ],
          },
        ]
        expect(getEasingAtTime(tracks, 50)).toBeNull()
      })

      it('should return the easing when all tracks agree at given time', () => {
        const tracks = [
          {
            id: 't1',
            keyframes: [
              { id: 'k1', time: 0, value: 0, easing: 'ease-in' },
              { id: 'k2', time: 100, value: 100, easing: 'linear' },
            ],
          },
          {
            id: 't2',
            keyframes: [
              { id: 'k3', time: 0, value: 1, easing: 'ease-in' },
              { id: 'k4', time: 100, value: 0, easing: 'ease-in' },
            ],
          },
        ]
        expect(getEasingAtTime(tracks, 0)).toBe('ease-in')
      })

      it('should return most frequent easing when tracks differ at given time', () => {
        const tracks = [
          {
            id: 't1',
            keyframes: [
              { id: 'k1', time: 0, value: 0, easing: 'ease-in' },
              { id: 'k2', time: 100, value: 100, easing: 'linear' },
            ],
          },
          {
            id: 't2',
            keyframes: [
              { id: 'k3', time: 0, value: 1, easing: 'ease-in' },
              { id: 'k4', time: 100, value: 0, easing: 'linear' },
            ],
          },
          {
            id: 't3',
            keyframes: [
              { id: 'k5', time: 0, value: 50, easing: 'ease-out' },
              { id: 'k6', time: 100, value: 100, easing: 'linear' },
            ],
          },
        ]
        expect(getEasingAtTime(tracks, 0)).toBe('ease-in')
      })
    })
  })
})
