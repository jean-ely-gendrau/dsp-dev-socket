class SessionStorage extends SessionStorage {
  constructor() {
    super();
    this.session = new Map();
  }

  findSession(id) {
    return this.session.id;
  }

  saveSession(id, session) {
    this.session.set(id, session);
  }

  findAllSession() {
    return [...this.session.values()];
  }
}