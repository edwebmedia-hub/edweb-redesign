<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$to      = 'info@spiralguard.co.za';
$name    = htmlspecialchars(trim($_POST['name']    ?? ''));
$company = htmlspecialchars(trim($_POST['company'] ?? ''));
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone   = htmlspecialchars(trim($_POST['phone']    ?? ''));
$product = htmlspecialchars(trim($_POST['product']  ?? ''));
$qty     = htmlspecialchars(trim($_POST['quantity'] ?? ''));
$message = htmlspecialchars(trim($_POST['message']  ?? ''));
$website = trim($_POST['website'] ?? '');

// Honeypot: bots fill the hidden "website" field; drop silently with a fake success.
if ($website !== '') {
    echo json_encode(['success' => true]);
    exit;
}

if (!$name || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$message) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

if (strlen($message) > 5000 || strlen($name) > 200) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Message is too long.']);
    exit;
}

$subject = "Quote Request from $name" . ($company ? " ($company)" : '');

$body  = "New quote request from spiralguard.co.za\n";
$body .= "==========================================\n\n";
$body .= "Name:     $name\n";
$body .= "Company:  $company\n";
$body .= "Email:    $email\n";
$body .= "Phone:    $phone\n";
$body .= "Product:  $product\n";
$body .= "Quantity: $qty\n\n";
$body .= "Message:\n$message\n";

$msgId    = '<' . time() . '.' . rand() . '@spiralguard.co.za>';
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Date: " . date('r') . "\r\n";
$headers .= "Message-ID: $msgId\r\n";
$headers .= "From: Spiral Guard Website <info@spiralguard.co.za>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, $subject, $body, $headers, '-f info@spiralguard.co.za');

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Your quote request has been sent. We\'ll be in touch within 24 hours.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Sorry, the message could not be sent. Please email us directly at info@spiralguard.co.za']);
}
