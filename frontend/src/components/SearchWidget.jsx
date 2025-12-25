import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

function SearchWidget() {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?query=${encodeURIComponent(query)}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                Find players, posts, and clans across the community.
            </p>
            <div className="flex gap-2">
                <Input
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit">
                    <Search className="h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}

export default SearchWidget;
