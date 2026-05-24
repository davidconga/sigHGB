<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Allows Sanctum's auth middleware to accept a `?token=...` query string by
 * promoting it to an `Authorization: Bearer ...` header before auth runs.
 *
 * Needed for endpoints that are opened as a regular link (PDF preview from the
 * mobile app via Linking.openURL or from a browser print/download), where the
 * client can't set request headers.
 */
class AcceptTokenFromQuery
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization') && $request->has('token')) {
            $request->headers->set('Authorization', 'Bearer '.$request->query('token'));
        }
        return $next($request);
    }
}
