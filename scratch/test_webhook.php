<?php

$ch = curl_init('http://127.0.0.1:8000/api/webhook/whatsapp/transaction');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-AI-Secret-Key: financetrack-ai-secret-2026',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'sender_phone' => '6281524261964',
    'type' => 'pengeluaran',
    'amount' => 5000,
    'title' => 'Parkir Motor',
    'category' => 'Transportasi',
    'payment_method' => 'Cash',
    'date' => '2026-10-15',
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo 'HTTP CODE: '.$httpCode."\n";
echo "RESPONSE:\n".$response."\n";
