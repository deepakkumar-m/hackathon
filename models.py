"""
GBME DevOps Hackathon - Database Models
SQLite-based storage for team progress.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'hackathon.db')


def get_db():
    """Get a database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables."""
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id TEXT NOT NULL,
            challenge_id INTEGER NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(team_id, challenge_id)
        );
    ''')
    conn.commit()
    conn.close()


def get_team_progress(team_id):
    """Get list of completed challenge IDs for a team."""
    conn = get_db()
    rows = conn.execute(
        'SELECT challenge_id FROM progress WHERE team_id = ? ORDER BY challenge_id',
        (team_id,)
    ).fetchall()
    conn.close()
    return [row['challenge_id'] for row in rows]


def complete_challenge(team_id, challenge_id):
    """Mark a challenge as complete for a team."""
    conn = get_db()
    try:
        conn.execute(
            'INSERT OR IGNORE INTO progress (team_id, challenge_id) VALUES (?, ?)',
            (team_id, challenge_id)
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def uncomplete_challenge(team_id, challenge_id):
    """Remove challenge completion for a team (admin use)."""
    conn = get_db()
    conn.execute(
        'DELETE FROM progress WHERE team_id = ? AND challenge_id = ?',
        (team_id, challenge_id)
    )
    conn.commit()
    conn.close()


def is_challenge_unlocked(team_id, challenge_id):
    """Check if a challenge is unlocked for a team."""
    if challenge_id == 1:
        return True
    completed = get_team_progress(team_id)
    return (challenge_id - 1) in completed


def get_all_teams_progress():
    """Get progress for all teams (admin view)."""
    conn = get_db()
    rows = conn.execute(
        'SELECT team_id, challenge_id, completed_at FROM progress ORDER BY team_id, challenge_id'
    ).fetchall()
    conn.close()

    teams = {}
    for row in rows:
        tid = row['team_id']
        if tid not in teams:
            teams[tid] = []
        teams[tid].append({
            'challenge_id': row['challenge_id'],
            'completed_at': row['completed_at']
        })
    return teams


def reset_team_progress(team_id):
    """Reset all progress for a team."""
    conn = get_db()
    conn.execute('DELETE FROM progress WHERE team_id = ?', (team_id,))
    conn.commit()
    conn.close()


def reset_all_progress():
    """Reset all progress for all teams."""
    conn = get_db()
    conn.execute('DELETE FROM progress')
    conn.commit()
    conn.close()
