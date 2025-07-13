-- MySQL: Tabla de relación usuario-carta
CREATE TABLE IF NOT EXISTS user_cards (
    user_id INT NOT NULL,
    card_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, card_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);
