import { LowSync, MemorySync } from "lowdb";
import { JSONFileSync } from "lowdb-node";
import { v4 as uuidv4 } from "uuid";
import shortid from "shortid";
import bcrypt from "bcryptjs";

const DEFAULT_ADAPTER =
  process.env.NODE_ENV === "test"
    ? new MemorySync()
    : new JSONFileSync("./db.json");

export default class SimpleUsersDao {
  constructor(seeds = [], adapter = DEFAULT_ADAPTER) {
    this.db = new LowSync(adapter, { users: [] });

    this.db.read();

    if (seeds.length > 0) {
      seeds.forEach((user) => this.createUser(user));
    }
  }

  getDb() {
    return this.db;
  }

  generateId() {
    return uuidv4();
  }

  generateVerificationToken() {
    return shortid.generate();
  }

  getUserById = (userId) => {
    return this.db.data.users
      .filter((user) => {
        // This one can get gross with numerical ids
        // eslint-disable-next-line eqeqeq
        return user.id == userId;
      })
      .shift();
  };

  getUserByUsername = (username) => {
    return this.db.data.users
      .filter((user) => {
        return user.username === username;
      })
      .shift();
  };

  getUserByUsernameAndPassword = (username, password) => {
    // Treat this like a failed login.
    if (!username || !password) {
      return false;
    }

    const user = this.getUserByUsername(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return false;
    }

    return user;
  };

  getUserByVerificationToken = (token) => {
    return this.db.data.users
      .filter((user) => user.verification_token === token)
      .shift();
  };

  createUser = (user) => {
    const existing = this.getUserByUsername(user.username);

    if (existing) {
      throw new Error("This username is already taken.");
    }

    const now = new Date();
    const data = {
      ...user,
      password: bcrypt.hashSync(user.password, 10),
      id: this.generateId(),
      verification_token: this.generateVerificationToken(),
      created_at: now,
      last_updated: now,
    };
    this.db.data.users.push(data);
    this.db.write();
    return data;
  };

  updateUser = (userId, user) => {
    const now = new Date();
    this.db.data.users = this.db.data.users.map((u) => {
      if (u.id === userId) {
        // If the password has been set, encrypt it
        if (user.password) {
          user.password = bcrypt.hashSync(user.password, 10);
        }

        return {
          ...u,
          ...user,
          id: userId,
          last_updated: now,
        };
      }
      return u;
    });
    this.db.write();
    return this.getUserById(userId);
  };
}
