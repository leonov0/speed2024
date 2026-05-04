<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

const USERS_FILE = __DIR__ . '/users.json';
const FLASH_KEY = '__flash';

function load_users(): array
{
    if (!file_exists(USERS_FILE)) {
        return [];
    }

    $rawData = file_get_contents(USERS_FILE);
    if ($rawData === false || trim($rawData) === '') {
        return [];
    }

    $decoded = json_decode($rawData, true);
    return is_array($decoded) ? $decoded : [];
}

function save_users(array $users): void
{
    $encoded = json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($encoded === false) {
        throw new RuntimeException('Unable to encode user data.');
    }

    file_put_contents(USERS_FILE, $encoded . PHP_EOL, LOCK_EX);
}

function find_user_by_username(array $users, string $username): ?array
{
    foreach ($users as $user) {
        if (!is_array($user)) {
            continue;
        }

        $storedUsername = (string) ($user['username'] ?? '');
        if ($storedUsername !== '' && hash_equals($storedUsername, $username)) {
            return $user;
        }
    }

    return null;
}

function current_user(): ?string
{
    return isset($_SESSION['user']) ? (string) $_SESSION['user'] : null;
}

function set_flash_message(string $type, string $message): void
{
    $_SESSION[FLASH_KEY] = [
        'type' => $type,
        'message' => $message,
    ];
}

function consume_flash_message(): ?array
{
    if (!isset($_SESSION[FLASH_KEY]) || !is_array($_SESSION[FLASH_KEY])) {
        return null;
    }

    $flash = $_SESSION[FLASH_KEY];
    unset($_SESSION[FLASH_KEY]);

    return $flash;
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}