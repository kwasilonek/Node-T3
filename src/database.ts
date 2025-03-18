import { Exercise, User } from '@/interfaces';
import fs from 'fs'
import sqlite3 from 'sqlite3'


const DB_FILE = 'database.db';

let db: sqlite3.Database;

export function init() {
    deleteDatabase()
    db = createDatabase()
    createUsersTable()
    createExercisesTable()
}

function deleteDatabase() {
    if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
        // console.log("Existing database deleted.");
    }
}

function createDatabase() {
    return new sqlite3.Database(DB_FILE, (err) => {
        if (err) {
            console.error("Error creating database:", err.message);
        } else {
            // console.log("New SQLite database created.");
        }
    });
}

function createUsersTable() {
    db.serialize(() => {
        db.run(`CREATE TABLE users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL
          )`, (err) => {
            if (err) console.error("Error creating users table:", err.message);
            // else console.log("Users table ready.");
        });
    });
}

function createExercisesTable() {
    db.serialize(() => {
        db.run(`CREATE TABLE exercises (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              userId INTEGER NOT NULL,
              duration INTEGER NOT NULL,
              description TEXT NOT NULL,
              date TEXT NOT NULL,
              FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
          )`, (err) => {
            if (err) console.error("Error creating exercises table:", err.message);
            // else console.wlog("Exercises table ready.");
        });
    });
}

export async function getUser(key: 'username' | 'id', value: string | number): Promise<User> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE ${key} = ?`, [value], (err: { message: any; }, row: User) => {
            if (err) {
                reject(new Error(`Error inserting user: ${err.message}`));
            } else {
                resolve(row);
            }
        })
    });
}

export function insertUsers(username: string) {
    return new Promise<number>((resolve, reject) => {
        db.serialize(() => {
            console.log(username);

            const stmt = db.prepare('INSERT INTO users (username) VALUES (?)');

            stmt.run([username], function (err: any) {
                stmt.finalize(err => {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
            });
        });
    })
}

export function getAllUsers(): Promise<User[]> {
    return new Promise((resolve, reject) => {
        const query = db.prepare('SELECT * FROM users')
        query.all([], (err, rows: User[]) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}

export function insertExercise(params: { userId: number, duration: number, description: string, date: string }): Promise<number> {
    return new Promise((resolve, reject) => {
        db.serialize(() => {

            const stmt = db.prepare('INSERT INTO exercises (userId, duration, description, date) VALUES (?, ?, ?, ?)');

            stmt.run([params.userId, params.duration, params.description, params.date], function (err: any) {
                stmt.finalize(err => {
                    if (err) reject(err);
                    resolve(this.lastID);
                });
            });
        });
    })
}

export function getUserExercises(userId: number, from: string, to: string, limit: number): Promise<Exercise[]> {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM exercises WHERE userId = ?`;

        const params: any[] = [userId];

        if (from && to) {
            sql += ` AND date BETWEEN ? AND ?`;
            params.push(from, to);
        } else if (from) {
            sql += ` AND date >= ?`;
            params.push(from);
        } else if (to) {
            sql += ` AND date <= ?`;
            params.push(to);
        }

        if (limit > 0) {
            sql += ` LIMIT ?`;
            params.push(limit);
        }

        db.all(sql, params, (err, rows: Exercise[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}