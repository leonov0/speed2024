<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';

unset($_SESSION['user']);
set_flash_message('success', 'You have been logged out.');

header('Location: index.php');
exit;