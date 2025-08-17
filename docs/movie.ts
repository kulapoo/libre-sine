type Movie = {
    id: number;
    name: string;
    description?: string;
    image_url: string;
    movie_url: string;
    source_type: string;
    created_at: string;
    updated_at: string;
    rating: number;
    genres?: string[];
    director?: string;
    actors?: string[];
    favorite?: boolean;
}