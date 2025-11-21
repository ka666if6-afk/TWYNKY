/*
Copyright 2024 New Vector Ltd.
Copyright 2022 The Matrix.org Foundation C.I.C.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { useCallback, useState } from "react";

import { MatrixClientPeg } from "../MatrixClientPeg";
import { DirectoryMember } from "../utils/direct-messages";
import { useLatestResult } from "./useLatestResult";

export interface IUserDirectoryOpts {
    limit: number;
    query: string;
}

export const useUserDirectory = (): {
    ready: boolean;
    loading: boolean;
    users: DirectoryMember[];
    search(opts: IUserDirectoryOpts): Promise<boolean>;
} => {
    const [users, setUsers] = useState<DirectoryMember[]>([]);

    const [loading, setLoading] = useState(false);

    const [updateQuery, updateResult] = useLatestResult<{ term: string; limit?: number }, DirectoryMember[]>(setUsers);

    const search = useCallback(
        async ({ limit = 20, query: term }: IUserDirectoryOpts): Promise<boolean> => {
            if (!term?.length) {
                setUsers([]);
                return true;
            }

            setLoading(true);
            let queryTerm = term.trim();
            
            try {
                const client = MatrixClientPeg.safeGet();
                
                // Используем TWYNKY как домен по умолчанию
                const serverDomain = "TWYNKY";
                const homeserverUrl = client.getHomeserverUrl();
                
                // Очищаем от @ и :domain
                let localpart = queryTerm;
                if (localpart.startsWith("@")) {
                    localpart = localpart.substring(1);
                }
                if (localpart.includes(":")) {
                    localpart = localpart.split(":")[0];
                }
                
                // API ищет только по localpart (имени), но мы формируем полный ID для логирования
                const searchTerm = localpart;
                const fullMatrixId = `@${localpart}:${serverDomain}`;
                
                console.log("Homeserver URL:", homeserverUrl);
                console.log("Searching user directory with term:", searchTerm);
                console.log("Full Matrix ID:", fullMatrixId);
                
                try {
                    // Сначала пробуем получить профиль конкретного пользователя по полному ID
                    try {
                        const profile = await client.getProfileInfo(fullMatrixId);
                        if (profile) {
                            console.log("Found user profile:", profile);
                            const directoryUser = {
                                user_id: fullMatrixId,
                                display_name: profile.displayname || localpart,
                                avatar_url: profile.avatar_url,
                            };
                            
                            updateQuery({ limit, term: fullMatrixId });
                            updateResult(
                                { limit, term: fullMatrixId },
                                [new DirectoryMember(directoryUser)],
                            );
                            return true;
                        }
                    } catch (profileError) {
                        console.debug("Profile not found, trying directory search:", profileError);
                    }
                    
                    // Если профиль не найден, ищем в directory
                    const searchResults = await client.searchUserDirectory({ term: searchTerm, limit });
                    console.log("Search results:", searchResults);
                    
                    if (searchResults?.results && searchResults.results.length > 0) {
                        const results = searchResults.results;
                        console.log("Found results, count:", results.length);
                        
                        updateQuery({ limit, term: fullMatrixId });
                        updateResult(
                            { limit, term: fullMatrixId },
                            results.map((user) => new DirectoryMember(user)),
                        );
                        return true;
                    }
                } catch (e) {
                    console.error("User directory search error:", e);
                }
                
                // No results found
                updateQuery({ limit, term: fullMatrixId });
                updateResult({ limit, term: fullMatrixId }, []);
                return false;
            } catch (e) {
                console.error("Could not search user directory", { limit, term }, e);
                updateQuery({ limit, term: queryTerm });
                updateResult({ limit, term: queryTerm }, []);
                return false;
            } finally {
                setLoading(false);
            }
        },
        [updateQuery, updateResult],
    );

    return {
        ready: true,
        loading,
        users,
        search,
    } as const;
};
