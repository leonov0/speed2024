<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';

$flash = consume_flash_message();
$user = current_user();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>
</head>
<body>
  <h1>Login System</h1>
  <p>
    <a href="index.php">Home</a>
    <a href="register.php">Register</a>
    <a href="login.php">Login</a>
  </p>

  <?php if ($flash !== null): ?>
    <p><?= e((string) ($flash['message'] ?? '')) ?></p>
  <?php endif; ?>

  <?php if ($user !== null): ?>
    <p>Logged in as <?= e($user) ?></p>
    <form action="logout.php" method="post">
      <button type="submit">Logout</button>
    </form>
  <?php else: ?>
    <p>Not logged in.</p>
  <?php endif; ?>
</body>
</html>