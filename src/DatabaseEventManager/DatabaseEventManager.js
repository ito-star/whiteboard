import { onDatabaseEvent } from "../utils";

/**
 * Helper class to manage cleanup of Firebase Realtime Database event handlers
 */
class DatabaseEventManager {
  unsubscribers = [];

  /**
   * Register a Firebase Realtime Database event handler
   *
   * Calls `refOrQuery.on()` with all of the other arguments.
   *
   * Returns a function that will call `refOrQuery.off()` appropriately. This function
   * can then be called when it is time to unbind `callback`.
   *
   * @link https://firebase.google.com/docs/reference/js/v8/firebase.database.Query?authuser=0#on
   *
   * @param {firebase.database.Query} refOrQuery
   * @param {firebase.database.EventType} eventType
   * @param {Function} callback
   * @param {Function|Object|null} cancelCallbackOrContext
   * @param {Object|null} context
   * @returns {Function}
   */
  on(refOrQuery, eventType, callback, cancelCallbackOrContext, context) {
    const unsubscriber = onDatabaseEvent(
      refOrQuery,
      eventType,
      callback,
      cancelCallbackOrContext,
      context
    );

    this.unsubscribers.push(unsubscriber);

    return unsubscriber;
  }

  /**
   * Unsubscribe all registered Firebase Realtime Database event handlers
   */
  unsubscribe() {
    this.unsubscribers.forEach((unsubscriber) => {
      unsubscriber();
    });

    this.unsubscribers = [];
  }
}

export default DatabaseEventManager;
