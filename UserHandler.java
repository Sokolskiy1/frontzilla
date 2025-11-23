package java_backend.controller;

import com.sun.net.httpserver.HttpHandler;
import java_backend.connector.ConnectorBD;
import java.sql.*;
import com.sun.net.httpserver.HttpExchange;
import java_backend.service.UserService;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.io.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class UserHandler implements HttpHandler {

    private UserService userService;

    public UserHandler() {
        try {
            this.userService = new UserService();
        } catch (SQLException e) {
            System.err.println("Ошибка при инициализации UserService: " + e.getMessage());
            throw new RuntimeException("Не удалось инициализировать обработчик пользователей", e);
        }
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        System.out.println("Получен запрос: " + exchange.getRequestMethod() + " " + exchange.getRequestURI());

        try {
            switch (exchange.getRequestMethod()) {
                case "POST":
                    handleCreateUser(exchange);
                    break;
                case "GET":
                    if (path.startsWith("/api/file")) {
                        handleFileRequest(exchange);
                    } else {
                        handleLoginUser(exchange);
                    }
                    break;
                default:
                    sendResponse(exchange, 405, "Method Not Allowed");
            }
        } catch (Exception e) {
            System.err.println("Ошибка обработки запроса: " + e.getMessage());
            sendResponse(exchange, 500, "Internal Server Error: " + e.getMessage());
        }
    }

    private void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.sendResponseHeaders(statusCode, response.getBytes(StandardCharsets.UTF_8).length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(response.getBytes(StandardCharsets.UTF_8));
        }
    }

    private void handleCreateUser(HttpExchange exchange) {
        try {
            InputStream requestBody = exchange.getRequestBody();
            String body = new String(requestBody.readAllBytes(), StandardCharsets.UTF_8);

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(body);

            String login = jsonNode.get("login").asText();
            String password = jsonNode.get("password").asText();

            boolean userCreated = userService.createUser(login, password);

            if (userCreated) {
                String response = "{\"message\": \"Пользователь создан успешно\"}";
                sendResponse(exchange, 201, response);
            } else {
                String response = "{\"error\": \"Пользователь с таким логином уже существует\"}";
                sendResponse(exchange, 409, response);
            }

        } catch (IOException e) {
            System.err.println("Ошибка чтения тела запроса: " + e.getMessage());
            try {
                sendResponse(exchange, 400, "{\"error\": \"Ошибка чтения данных запроса\"}");
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        } catch (Exception e) {
            System.err.println("Ошибка обработки JSON: " + e.getMessage());
            try {
                sendResponse(exchange, 400, "{\"error\": \"Ошибка обработки данных: " + e.getMessage() + "\"}");
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
    }

    private void handleLoginUser(HttpExchange exchange) throws IOException {
        try {
            // Получаем параметры из query string или тела запроса
            String login = null;
            String password = null;

            // Проверяем, есть ли параметры в query string
            String query = exchange.getRequestURI().getQuery();
            if (query != null && !query.isEmpty()) {
                String[] params = query.split("&");
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2) {
                        if ("login".equals(keyValue[0])) {
                            login = keyValue[1];
                        } else if ("password".equals(keyValue[0])) {
                            password = keyValue[1];
                        }
                    }
                }
            }

            // Если параметры не найдены в query string, проверяем тело запроса
            if (login == null || password == null) {
                InputStream requestBody = exchange.getRequestBody();
                String body = new String(requestBody.readAllBytes(), StandardCharsets.UTF_8);

                if (!body.isEmpty()) {
                    ObjectMapper objectMapper = new ObjectMapper();
                    JsonNode jsonNode = objectMapper.readTree(body);
                    login = jsonNode.get("login").asText();
                    password = jsonNode.get("password").asText();
                }
            }

            // Проверяем, что логин и пароль предоставлены
            if (login == null || password == null || login.trim().isEmpty() || password.trim().isEmpty()) {
                sendResponse(exchange, 400, "{\"error\": \"Необходимо указать login и password\"}");
                return;
            }

            // Проверяем учетные данные
            boolean isAuthenticated = userService.authenticateUser(login, password);

            if (isAuthenticated) {
                // Генерируем простой токен (в реальном приложении используйте JWT)
                String token = userService.generateToken(login);
                String response = String.format("{\"message\": \"Авторизация успешна\", \"token\": \"%s\"}", token);
                sendResponse(exchange, 200, response);
            } else {
                sendResponse(exchange, 401, "{\"error\": \"Неверный логин или пароль\"}");
            }

        } catch (IOException e) {
            System.err.println("Ошибка чтения тела запроса: " + e.getMessage());
            sendResponse(exchange, 400, "{\"error\": \"Ошибка чтения данных запроса\"}");
        } catch (Exception e) {
            System.err.println("Ошибка авторизации: " + e.getMessage());
            sendResponse(exchange, 500, "{\"error\": \"Внутренняя ошибка сервера\"}");
        }
    }

    private void handleFileRequest(HttpExchange exchange) throws IOException {
        try {
            // Проверяем авторизацию
            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                sendResponse(exchange, 401, "{\"error\": \"Требуется авторизация\"}");
                return;
            }

            String token = authHeader.substring(7); // Убираем "Bearer "
            if (!userService.validateToken(token)) {
                sendResponse(exchange, 401, "{\"error\": \"Недействительный токен\"}");
                return;
            }

            // Парсим query параметры
            String query = exchange.getRequestURI().getQuery();
            if (query != null && !query.isEmpty()) {
                String[] params = query.split("&");
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2 && "uuid".equals(keyValue[0])) {
                        handleFileDownload(exchange, keyValue[1]);
                        return;
                    }
                }
            }

            // Если нет uuid, показываем список файлов
            handleFileList(exchange);

        } catch (Exception e) {
            System.err.println("Ошибка обработки запроса файла: " + e.getMessage());
            sendResponse(exchange, 500, "{\"error\": \"Внутренняя ошибка сервера\"}");
        }
    }

    private void handleFileList(HttpExchange exchange) throws IOException {
        // Заглушка для списка файлов
        // В реальном приложении здесь будет логика получения файлов из базы данных
        String response = "[{\"id\": \"1\", \"name\": \"example.txt\", \"size\": 1024, \"uploadDate\": \"2024-01-01\"}]";
        sendResponse(exchange, 200, response);
    }

    private void handleFileDownload(HttpExchange exchange, String uuid) throws IOException {
        // Заглушка для скачивания файла
        // В реальном приложении здесь будет логика получения файла по uuid
        String response = "Файл с UUID: " + uuid + " не найден";
        sendResponse(exchange, 404, "{\"error\": \"" + response + "\"}");
    }
}
