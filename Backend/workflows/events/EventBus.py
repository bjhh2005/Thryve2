
class EventBus:

    def __init__(self):
        self.listeners = {}

    def on(self, eventName, callback):
        self.listeners[eventName] = callback

    def emit(self, eventName, *args, **kwargs):
        return self.listeners[eventName](*args, **kwargs)
    