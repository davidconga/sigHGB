<?php

namespace App\Support;

class HtmlSanitizer
{
    private const ALLOWED_TAGS = '<p><br><strong><b><em><i><u><s><strike><ul><ol><li>';

    public static function clean(?string $html): ?string
    {
        if ($html === null) return null;
        $clean = strip_tags($html, self::ALLOWED_TAGS);
        $clean = preg_replace('/\son[a-z]+\s*=\s*"[^"]*"/i', '', $clean);
        $clean = preg_replace("/\son[a-z]+\s*=\s*'[^']*'/i", '', $clean);
        return trim($clean) === '' ? null : $clean;
    }

    public static function cleanArray(array $data, array $fields): array
    {
        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $data[$f] = self::clean($data[$f] ?? null);
            }
        }
        return $data;
    }
}
