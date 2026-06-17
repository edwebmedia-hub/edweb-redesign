<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://www.edwebmedia.com');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    // Also accept regular form POST
    $data = $_POST;
}

$to      = 'info@edwebmedia.com';
$type    = isset($data['type']) ? $data['type'] : 'contact';

// Sanitise inputs
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val ?? '')));
}

if ($type === 'booking') {
    // --- Schedule a meeting submission ---
    $name  = clean($data['name']);
    $email = clean($data['email']);
    $phone = clean($data['phone']);
    $date  = clean($data['meeting_date']);
    $note  = clean($data['note']);

    if (!$name || !$email || !$phone || !$date) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $subject = "Meeting Request — $date";
    $body    = "You have a new meeting request from your website.\n\n"
             . "Name:         $name\n"
             . "Email:        $email\n"
             . "Phone:        $phone\n"
             . "Requested:    $date\n"
             . "Note:         " . ($note ?: 'None') . "\n";

} else {
    // --- Contact / MSF form submission ---
    $name     = clean($data['first_name'] . ' ' . $data['last_name']);
    $email    = clean($data['email']);
    $phone    = clean($data['phone']);
    $services = clean($data['services']);
    $budget   = clean($data['budget']);
    $timeline = clean($data['timeline']);
    $message  = clean($data['message']);

    if (!$name || !$email) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit;
    }

    $subject = "New Enquiry from $name";
    $body    = "New enquiry from your website.\n\n"
             . "Name:         $name\n"
             . "Email:        $email\n"
             . "Phone:        $phone\n"
             . "Services:     $services\n"
             . "Budget:       $budget\n"
             . "Timeline:     $timeline\n\n"
             . "Message:\n$message\n";
}

$headers  = "From: website@edwebmedia.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Email sent']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send email']);
}
