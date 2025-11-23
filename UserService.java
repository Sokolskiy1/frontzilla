package java_backend.service;

import java_backend.connector.ConnectorBD;
import java.sql.*;
import java.util.UUID;

public class UserService {

    private ConnectorBD connectorBD;

    public UserService() throws SQLException {
        this.connectorBD = new ConnectorBD();
    }

    public boolean createUser(String login, String password) {
        String checkQuery = "SELECT COUNT(*) FROM users WHERE login = ?";
        String insertQuery = "INSERT INTO users (login, password) VALUES (?, ?)";

        try (Connection connection = connectorBD.getConnection();
             PreparedStatement checkStmt = connection.prepareStatement(checkQuery);
             PreparedStatement insertStmt = connection.prepareStatement(insertQuery)) {

            // Проверяем, существует ли пользователь
            checkStmt.setString(1, login);
            ResultSet rs = checkStmt.executeQuery();
            if (rs.next() && rs.getInt(1) > 0) {
                return false; // Пользователь уже существует
            }

            // Создаем нового пользователя
            insertStmt.setString(1, login);
            insertStmt.setString(2, password); // В реальном приложении пароль должен быть хеширован!
            insertStmt.executeUpdate();

            return true;

        } catch (SQLException e) {
            System.err.println("Ошибка при создании пользователя: " + e.getMessage());
            return false;
        }
    }

    public boolean authenticateUser(String login, String password) {
        String query = "SELECT password FROM users WHERE login = ?";

        try (Connection connection = connectorBD.getConnection();
             PreparedStatement stmt = connection.prepareStatement(query)) {

            stmt.setString(1, login);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String storedPassword = rs.getString("password");
                // В реальном приложении сравнивайте хешированные пароли!
                return password.equals(storedPassword);
            }

            return false; // Пользователь не найден

        } catch (SQLException e) {
            System.err.println("Ошибка при авторизации пользователя: " + e.getMessage());
            return false;
        }
    }

    public String generateToken(String login) {
        // Простая генерация токена. В реальном приложении используйте JWT!
        String token = login + "_" + UUID.randomUUID().toString() + "_" + System.currentTimeMillis();
        return token;
    }

    public boolean validateToken(String token) {
        // Простая валидация токена. В реальном приложении проверяйте JWT!
        if (token == null || token.isEmpty()) {
            return false;
        }
        // Проверяем, что токен содержит подчеркивания (наш формат)
        return token.contains("_");
    }
}
