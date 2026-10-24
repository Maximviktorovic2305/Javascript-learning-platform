import { describe, expect, it, vi } from 'vitest'
import { createMusicPlayback } from '../app/composables/useBackgroundMusic'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

function fixture(saved: string | null = null) {
  const audio = {
    paused: true,
    error: null as HTMLAudioElement['error'],
    play: vi.fn(async () => {
      audio.paused = false
    }),
    pause: vi.fn(() => {
      audio.paused = true
    }),
    load: vi.fn(),
  }
  const storage = {
    read: vi.fn(() => saved),
    write: vi.fn((value: string) => {
      saved = value
    }),
  }
  return {
    audio,
    storage,
    player: createMusicPlayback({ audio: () => audio, ...storage }),
  }
}

describe('background music preference and playback', () => {
  it('attempts playback by default without overwriting an unset preference', async () => {
    const { player, audio, storage } = fixture()
    await player.restore()
    expect(player.enabled.value).toBe(true)
    expect(audio.play).toHaveBeenCalledOnce()
    expect(player.playing.value).toBe(true)
    expect(storage.write).not.toHaveBeenCalled()
  })

  it('honors a saved off preference after reload instead of using the default', async () => {
    const { player, audio, storage } = fixture('off')
    await player.restore()
    expect(player.enabled.value).toBe(false)
    expect(player.playing.value).toBe(false)
    expect(audio.play).not.toHaveBeenCalled()
    expect(storage.write).not.toHaveBeenCalled()
  })

  it('remembers both choices and restores enabled playback in a new player', async () => {
    const { player, audio, storage } = fixture()
    await player.toggle()
    expect(player.playing.value).toBe(true)
    expect(storage.write).toHaveBeenLastCalledWith('on')
    const restored = createMusicPlayback({ audio: () => audio, ...storage })
    await restored.restore()
    expect(restored.playing.value).toBe(true)
    await player.toggle()
    expect(player.playing.value).toBe(false)
    expect(audio.paused).toBe(true)
    expect(storage.write).toHaveBeenLastCalledWith('off')
  })

  it.each([null, 'on'])(
    'keeps music enabled when autoplay is blocked (preference: %s)',
    async (saved) => {
      const { player, audio, storage } = fixture(saved)
      audio.play.mockRejectedValueOnce(
        Object.assign(new Error('Blocked'), { name: 'NotAllowedError' }),
      )
      await player.restore()
      expect(player.enabled.value).toBe(true)
      expect(player.playing.value).toBe(false)
      expect(player.blocked.value).toBe(true)
      expect(player.error.value).toBe('')
      expect(storage.write).not.toHaveBeenCalled()
      await player.retryAfterGesture()
      expect(player.playing.value).toBe(true)
      expect(player.blocked.value).toBe(false)
    },
  )

  it('still permits manual playback when localStorage is unavailable', async () => {
    const { player, storage } = fixture()
    storage.read.mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    storage.write.mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    await player.restore()
    expect(player.playing.value).toBe(true)
    await player.toggle()
    expect(player.playing.value).toBe(false)
    await player.toggle()
    expect(player.playing.value).toBe(true)
  })

  it('does not restart after the user turns music off while play is pending', async () => {
    const { player, audio, storage } = fixture()
    const request = deferred()
    audio.play.mockImplementationOnce(async () => {
      await request.promise
      audio.paused = false
    })
    const starting = player.toggle()
    expect(player.pending.value).toBe(true)
    await player.toggle()
    request.resolve()
    await starting
    expect(audio.paused).toBe(true)
    expect(player.playing.value).toBe(false)
    expect(player.pending.value).toBe(false)
    expect(storage.write).toHaveBeenLastCalledWith('off')
  })

  it('does not let an older play request overwrite a newer enabled request', async () => {
    const { player, audio } = fixture()
    const first = deferred()
    const second = deferred()
    audio.play.mockImplementationOnce(async () => {
      await first.promise
      audio.paused = false
    })
    audio.play.mockImplementationOnce(async () => {
      await second.promise
      audio.paused = false
    })
    const oldPlay = player.toggle()
    await player.toggle()
    const newPlay = player.toggle()
    second.resolve()
    await newPlay
    first.resolve()
    await oldPlay
    expect(player.playing.value).toBe(true)
    expect(audio.paused).toBe(false)
  })

  it('stops playback when disposed, including delayed play completion', async () => {
    const { player, audio } = fixture()
    const request = deferred()
    audio.play.mockImplementationOnce(async () => {
      await request.promise
      audio.paused = false
    })
    const starting = player.toggle()
    player.dispose()
    request.resolve()
    await starting
    expect(audio.paused).toBe(true)
    expect(player.playing.value).toBe(false)
  })

  it('reports a failed download and allows a manual retry', async () => {
    const { player, audio } = fixture()
    audio.play.mockRejectedValueOnce(new Error('Network error'))
    await player.toggle()
    expect(player.error.value).toContain('не загрузилась')
    expect(player.playing.value).toBe(false)
    audio.error = { code: 2 } as MediaError
    await player.toggle()
    expect(audio.load).toHaveBeenCalledOnce()
    expect(player.playing.value).toBe(true)
    expect(player.error.value).toBe('')
  })
})
