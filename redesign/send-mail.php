<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

header('Content-Type: application/json');

$allowed = ['https://www.edwebmedia.com', 'https://edwebmedia.com'];
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean(); http_response_code(204); exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean(); http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']); exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) { $data = $_POST; }

$to   = 'info@edwebmedia.com';
$type = $data['type'] ?? 'contact';

// Honeypot: bots fill the hidden field; drop silently with a fake success.
$company = trim($data['company'] ?? '');
if ($company !== '') {
    ob_end_clean();
    echo json_encode(['success' => true]); exit;
}

function clean($val) {
    return htmlspecialchars(strip_tags(trim($val ?? '')));
}

if ($type === 'booking') {
    $name  = clean($data['name'] ?? '');
    $email = clean($data['email'] ?? '');
    $phone = clean($data['phone'] ?? '');
    $date  = clean($data['meeting_date'] ?? '');
    $note  = clean($data['note'] ?? '');

    if (!$name || !$email || !$phone || !$date) {
        ob_end_clean(); http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']); exit;
    }
    if (strlen($name) > 200 || strlen($note) > 5000) {
        ob_end_clean(); http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message is too long.']); exit;
    }

    $subject = "Meeting Request - $date";
    $body    = "New meeting request from edwebmedia.com\n\n"
             . "Name:      $name\n"
             . "Email:     $email\n"
             . "Phone:     $phone\n"
             . "Date:      $date\n"
             . "Note:      " . ($note ?: 'None') . "\n";

} else {
    $name     = clean(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));
    $email    = clean($data['email'] ?? '');
    $phone    = clean($data['phone'] ?? '');
    $services = clean($data['services'] ?? '');
    $budget   = clean($data['budget'] ?? '');
    $timeline = clean($data['timeline'] ?? '');
    $message  = clean($data['message'] ?? '');

    if (!trim($name) || !$email) {
        ob_end_clean(); http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']); exit;
    }
    if (strlen($message) > 5000 || strlen($name) > 200) {
        ob_end_clean(); http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Message is too long.']); exit;
    }

    $subject = "New Enquiry from $name";
    $body    = "New enquiry from edwebmedia.com\n\n"
             . "Name:      $name\n"
             . "Email:     $email\n"
             . "Phone:     $phone\n"
             . "Services:  $services\n"
             . "Budget:    $budget\n"
             . "Timeline:  $timeline\n\n"
             . "Message:\n$message\n";
}

require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'smtp.hostinger.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'info@edwebmedia.com';
    $mail->Password   = getenv('SMTP_PASS') ?: ''; // never hardcode; the 2026-07 hardcoded password was exposed in the public repo and must be treated as rotated
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 15;

    $mail->setFrom('info@edwebmedia.com', 'Edweb Media Website');
    $mail->addAddress($to);
    $mail->addReplyTo($email, $name);
    $mail->Subject = $subject;
    $mail->Body    = $body;

    $mail->send();
    ob_end_clean();
    echo json_encode(['success' => true, 'message' => 'Email sent']);
} catch (Exception $e) {
    $err = $mail->ErrorInfo;
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $err]);
}
