class MessageStorage {
  constructor() {
    this.message = new Map();
  }

  findMessage(id) {
    return this.message.get(id);
  }

  saveMessage(id, message) {
    this.message.set(id, message);
  }

  findAllMessage() {
    return [...this.message.values()];
  }
}

module.exports = MessageStorage