/**
 * EventBus Unit Tests
 */

import { EventBus } from '../plugin/EventBus'

describe('EventBus', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  describe('Event Subscription', () => {
    it('should subscribe to events', () => {
      const handler = jest.fn()
      bus.on('test', handler)

      bus.emit('test', 'arg1', 'arg2')

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should return unsubscribe function', () => {
      const handler = jest.fn()
      const unsubscribe = bus.on('test', handler)

      unsubscribe()
      bus.emit('test')

      expect(handler).not.toHaveBeenCalled()
    })

    it('should support multiple subscribers', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()
      const handler3 = jest.fn()

      bus.on('test', handler1)
      bus.on('test', handler2)
      bus.on('test', handler3)

      bus.emit('test')

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })

    it('should handle errors in listeners gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Listener error')
      })
      const normalHandler = jest.fn()

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      bus.on('test', errorHandler)
      bus.on('test', normalHandler)

      expect(() => {
        bus.emit('test')
      }).not.toThrow()

      expect(normalHandler).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in event listener for "test":',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Once Subscription', () => {
    it('should only trigger once', () => {
      const handler = jest.fn()
      bus.once('test', handler)

      bus.emit('test')
      bus.emit('test')
      bus.emit('test')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should support unsubscribe', () => {
      const handler = jest.fn()
      const unsubscribe = bus.once('test', handler)

      unsubscribe()
      bus.emit('test')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('Event Emission', () => {
    it('should emit events with arguments', () => {
      const handler = jest.fn()
      bus.on('test', handler)

      bus.emit('test', { foo: 'bar' }, [1, 2, 3])

      expect(handler).toHaveBeenCalledWith({ foo: 'bar' }, [1, 2, 3])
    })

    it('should emit batch events', () => {
      const handler = jest.fn()
      bus.on('event1', handler)
      bus.on('event2', handler)

      bus.emitBatch([
        { event: 'event1', args: ['arg1'] },
        { event: 'event2', args: ['arg2'] }
      ])

      expect(handler).toHaveBeenCalledTimes(2)
      expect(handler).toHaveBeenNthCalledWith(1, 'arg1')
      expect(handler).toHaveBeenNthCalledWith(2, 'arg2')
    })

    it('should do nothing when emitting to non-existent event', () => {
      expect(() => {
        bus.emit('non-existent')
      }).not.toThrow()
    })
  })

  describe('Event Management', () => {
    it('should remove specific listener', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      bus.on('test', handler1)
      bus.on('test', handler2)

      bus.off('test', handler1)
      bus.emit('test')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalled()
    })

    it('should remove all listeners for an event', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      bus.on('test', handler1)
      bus.on('test', handler2)

      bus.removeAllListeners('test')
      bus.emit('test')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })

    it('should clear all events', () => {
      const handler1 = jest.fn()
      const handler2 = jest.fn()

      bus.on('event1', handler1)
      bus.on('event2', handler2)

      bus.clear()

      expect(bus.getEventNames()).toHaveLength(0)
      bus.emit('event1')
      bus.emit('event2')

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
    })
  })

  describe('Listener Count', () => {
    it('should report listener count', () => {
      expect(bus.listenerCount('test')).toBe(0)

      bus.on('test', jest.fn())
      expect(bus.listenerCount('test')).toBe(1)

      bus.on('test', jest.fn())
      expect(bus.listenerCount('test')).toBe(2)

      bus.once('test', jest.fn())
      expect(bus.listenerCount('test')).toBe(3)
    })

    it('should get all event names', () => {
      bus.on('event1', jest.fn())
      bus.on('event2', jest.fn())
      bus.once('event3', jest.fn())

      const names = bus.getEventNames()

      expect(names).toContain('event1')
      expect(names).toContain('event2')
      expect(names).toContain('event3')
    })
  })
})
