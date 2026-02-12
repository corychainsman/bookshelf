export interface Book {
  _filename: string;
  full_title: string;
  author: string[];
  rating: number | null;
  start_date: string | null;
  end_date: string | null;
  format: 'audiobook' | 'ebook';
  where_i_got_it: string;
  finished: string;
  ISBN: string;
  image_url: string;
  thoughts: string | null;
  recommender: string | null;
  topics?: string[];
}

export type Topic =
  | 'Biography'
  | 'History'
  | 'Science'
  | 'Technology'
  | 'Fiction'
  | 'Politics'
  | 'Economics'
  | 'Business'
  | 'Psychology'
  | 'Social Science'
  | 'Design'
  | 'Parenting'
  | 'Memoir'
  | 'Military'
  | 'Space'
  | 'Linguistics'
  | 'Philosophy'
  | 'Food'
  | 'Health';

export type ViewMode = 'grid' | 'gantt' | 'trends';

export interface Filters {
  search: string;
  year: string;
  format: string;
  source: string;
  ratingMin: number;
  ratingMax: number;
  topic: string;
  sortBy: 'date' | 'rating' | 'title';
  sortDir: 'asc' | 'desc';
}
