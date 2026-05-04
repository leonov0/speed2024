<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';

$error = '';
$username = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if ($username === '' || trim($password) === '') {
        $error = 'Please fill in both username and password.';
    } else {
        $users = load_users();

        if (find_user_by_username($users, $username) !== null) {
            $error = 'That username is already registered. Choose a different one.';
        } else {
            $users[] = [
                'username' => $username,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'created_at' => date('c'),
            ];

            save_users($users);
            set_flash_message('success', 'Registration complete. You can log in now.');
            header('Location: login.php');
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
  <title>Register</title>
</head>
<body>
  <h1>Register</h1>
  <p>
    <a href="index.php">Home</a>
    <a href="login.php">Login</a>
  </p>

  <?php if ($error !== ''): ?>
    <p><?= e($error) ?></p>
  <?php endif; ?>

  <form method="post" action="register.php">
    <p>
      <label>Username</label><br>
      <input name="username" type="text" value="<?= e($username) ?>">
    </p>
    <p>
      <label>Password</label><br>
      <input name="password" type="password">
    </p>
    <button type="submit">Create account</button>
  </form>
</body>
</html>