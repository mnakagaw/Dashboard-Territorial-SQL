<?php
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$prompt = $data["prompt"];

$OPENAI_KEY = getenv("OPENAI_API_KEY");
if (!$OPENAI_KEY) {
    http_response_code(500);
    echo json_encode(["error" => "OPENAI_API_KEY is not configured."]);
    exit;
}

$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $OPENAI_KEY
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "model" => "gpt-4o-mini",
    "messages" => [
        ["role" => "user", "content" => $prompt]
    ]
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

echo $response;
