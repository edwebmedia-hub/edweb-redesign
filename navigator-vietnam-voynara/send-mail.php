<?php
header('Access-Control-Allow-Origin: https://navigator-vietnam.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Method not allowed']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$destination = trim($input['destination'] ?? '');
$dates = trim($input['dates'] ?? '');
$travellers = trim($input['travellers'] ?? '');
$message = trim($input['message'] ?? '');

if (!$name || !$email || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$message) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Name, a valid email and message are required.']);
  exit;
}

$to = 'info@navigator-vietnam.com';
$subject = 'New trip enquiry from ' . $name;

$body = "Name: $name\nEmail: $email\n";
if ($phone) $body .= "Phone: $phone\n";
if ($destination) $body .= "Destination: $destination\n";
if ($dates) $body .= "Travel dates: $dates\n";
if ($travellers) $body .= "Travellers: $travellers\n";
$body .= "\n$message";

$headers = "From: Navigator Vietnam Website <info@navigator-vietnam.com>\r\n";
$headers .= "Reply-To: " . $email . "\r\n";

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
  echo json_encode(['success' => true]);
} else {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Failed to send message.']);
}
