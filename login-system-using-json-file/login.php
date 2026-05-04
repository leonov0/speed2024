<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';

$error = '';
$username = '';
$flash = consume_flash_message();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if ($username === '' || trim($password) === '') {
        $error = 'Please fill in both username and password.';
    } else {
        $users = load_users();
        $user = find_user_by_username($users, $username);

        if ($user === null || !isset($user['password']) || !password_verify($password, (string) $user['password'])) {
            $error = 'Login failed. Check your username and password.';
        } else {
            $_SESSION['user'] = $username;
            set_flash_message('success', 'Login successful. Welcome back, ' . $username . '.');
            header('Location: index.php');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
</head>
<body>
  <h1>Login</h1>
  <p>
    <a href="index.php">Home</a>
    <a href="register.php">Register</a>
  </p>

  <?php if ($flash !== null): ?>
    <p><?= e((string) ($flash['message'] ?? '')) ?></p>
  <?php endif; ?>

  <?php if ($error !== ''): ?>
    <p><?= e($error) ?></p>
  <?php endif; ?>

  <form method="post" action="login.php">
    <p>
      <label>Username</label><br>
      <input name="username" type="text" value="<?= e($username) ?>">
    </p>
    <p>
      <label>Password</label><br>
      <input name="password" type="password">
    </p>
    <button type="submit">Login</button>
  </form>
</body>
</html>