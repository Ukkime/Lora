-- SQLite: Tabla de relación usuario-carta
CREATE TABLE IF NOT EXISTS user_cards (
    user_id INTEGER NOT NULL,
    card_id TEXT NOT NULL,
    PRIMARY KEY (user_id, card_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);
