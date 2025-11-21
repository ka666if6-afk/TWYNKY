/*
Copyright 2025 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { MatrixClientPeg } from "../MatrixClientPeg";
import SdkConfig from "../SdkConfig";

/**
 * Get the default homeserver domain configured in SdkConfig
 */
function getDefaultHomeserverDomain(): string {
    try {
        const client = MatrixClientPeg.get();
        if (client) {
            return client.getDomain() || "TWYNKY";
        }
        const validated = SdkConfig.get("validated_server_config");
        const defaultCfg = SdkConfig.get("default_server_config");
        return validated?.hsName || defaultCfg?.["m.homeserver"]?.["server_name"] || "TWYNKY";
    } catch {
        return "TWYNKY";
    }
}

/**
 * Extract the local part (username) from a Matrix ID
 * @param matrixId Full matrix ID like @username:example.com
 * @returns Just the username part (e.g., "@username")
 */
export function getLocalPart(matrixId: string): string {
    if (!matrixId) return "";
    
    // Remove @ if present
    const withoutAt = matrixId.startsWith("@") ? matrixId.slice(1) : matrixId;
    
    // Split by : and take first part
    const [localPart] = withoutAt.split(":");
    
    return `@${localPart}`;
}

/**
 * Get the display name (localpart with @) for UI display
 * Always returns ONLY @username, never with server
 * @param matrixId Full matrix ID or just username
 * @returns @username format only
 */
export function getDisplayName(matrixId: string): string {
    return getLocalPart(matrixId);
}

/**
 * Ensure a matrix ID has the full domain appended
 * If the ID is just a localpart (with or without @), append the default homeserver domain
 * @param matrixId Full ID (@user:domain.com) or localpart (@user or user)
 * @returns Full matrix ID (@user:domain.com)
 */
export function ensureFullMatrixId(matrixId: string): string {
    if (!matrixId) return "";
    
    // If it already has a domain, return as-is
    if (matrixId.includes(":")) {
        return matrixId;
    }
    
    // Add @ if not present
    const withAt = matrixId.startsWith("@") ? matrixId : `@${matrixId}`;
    
    // Add the default homeserver domain
    const domain = getDefaultHomeserverDomain();
    return `${withAt}:${domain}`;
}

/**
 * Prepare a user ID for sending to Matrix API
 * Ensures it has the full domain if needed
 * @param userId User ID from UI (may be just @username)
 * @returns Full matrix ID ready for API calls
 */
export function prepareUserIdForApi(userId: string): string {
    return ensureFullMatrixId(userId);
}

/**
 * Check if a matrix ID is just a localpart (without domain)
 * @param matrixId The matrix ID to check
 * @returns true if it's just @username without a domain
 */
export function isLocalPartOnly(matrixId: string): boolean {
    return !matrixId.includes(":");
}

/**
 * Get the server part of a matrix ID
 * @param matrixId Full matrix ID like @username:example.com
 * @returns Server name (e.g., "example.com") or null if localpart only
 */
export function getServerPart(matrixId: string): string | null {
    if (!matrixId.includes(":")) return null;
    const parts = matrixId.split(":");
    return parts[parts.length - 1];
}

/**
 * Build a list of candidate search terms for user directory lookup.
 * Prefer localpart-only for partial matching, but include a full MXID
 * with the configured homeserver if the homeserver requires it.
 * @param rawTerm The user input (may be "alice", "@alice", or "@alice:server")
 */
export function buildUserSearchTerms(rawTerm: string): string[] {
    if (!rawTerm) return [];
    let term = rawTerm.trim();

    // If user typed a full MXID, just use it
    if (term.includes(":")) return [term];

    // strip leading @ if present
    if (term.startsWith("@")) term = term.substring(1);

    const candidates: string[] = [];
    // first try localpart (no @) for server partial matching
    candidates.push(term);

    // also try full mxid with configured homeserver
    try {
        const client = MatrixClientPeg.get();
        let serverName = null;
        
        if (client) {
            // Try to get domain from the client
            serverName = client.getDomain();
        }
        
        if (!serverName) {
            // Fallback to SdkConfig
            const validated = SdkConfig.get("validated_server_config");
            const defaultCfg = SdkConfig.get("default_server_config");
            serverName = validated?.hsName || defaultCfg?.["m.homeserver"]?.["server_name"];
        }
        
        if (serverName) candidates.push(`@${term}:${serverName}`);
    } catch (e) {
        // ignore errors getting server name
    }

    return candidates;
}

/**
 * Replace all Matrix IDs in an object recursively with their local parts
 * Used for rendering purposes - displays only @username everywhere
 */
export function stripServerFromMatrixIds(obj: any): any {
    if (typeof obj === "string") {
        // If it looks like a Matrix ID (@something:server), return only @something
        if (obj.startsWith("@") && obj.includes(":")) {
            return getLocalPart(obj);
        }
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(stripServerFromMatrixIds);
    }
    
    if (obj !== null && typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            // Don't strip from specific keys that need full IDs
            if (key === "userId" || key === "user_id" || key === "displayName" || key === "avatar_url") {
                result[key] = value;
            } else {
                result[key] = stripServerFromMatrixIds(value);
            }
        }
        return result;
    }
    
    return obj;
}
