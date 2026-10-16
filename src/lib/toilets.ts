import { createClient } from '@supabase/supabase-js'

export type Review = {
  id: string
  author: string
  date: string
  rating: number
  text: string
}

export type ToiletSpot = {
  id: string
  name: string
  area: string
  city: string
  province: string
  lat: number
  lng: number
  rating: number
  price: number
  amenities: string[]
  image: string
  description: string
  verified: boolean
  reviews: Review[]
}

export type NewToiletSpot = Pick<
  ToiletSpot,
  'name' | 'area' | 'city' | 'province' | 'lat' | 'lng' | 'price' | 'amenities'
>

export type NewReview = Pick<Review, 'author' | 'rating' | 'text'>

type ToiletSpotRow = {
  id: string
  name: string
  area: string
  city: string
  province: string
  latitude: number
  longitude: number
  price: number
  amenities: string[]
  image: string
  description: string
  verified: boolean
  created_at: string
}

type ToiletReviewRow = {
  id: string
  toilet_spot_id: string
  author: string
  rating: number
  body: string
  created_at: string
}

type Database = {
  public: {
    Tables: {
      toilet_spots: {
        Row: ToiletSpotRow
        Insert: Omit<ToiletSpotRow, 'id' | 'created_at' | 'verified'> &
          Partial<Pick<ToiletSpotRow, 'id' | 'created_at' | 'verified'>>
        Update: Partial<ToiletSpotRow>
        Relationships: []
      }
      toilet_reviews: {
        Row: ToiletReviewRow
        Insert: Omit<ToiletReviewRow, 'id' | 'created_at'> &
          Partial<Pick<ToiletReviewRow, 'id' | 'created_at'>>
        Update: Partial<ToiletReviewRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey)
export const supabaseConfigurationIncomplete = Boolean(supabaseUrl) !== Boolean(supabaseKey)

const supabase =
  supabaseConfigured && supabaseUrl && supabaseKey
    ? createClient<Database>(supabaseUrl, supabaseKey)
    : null

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  return supabase
}

function mapReview(row: ToiletReviewRow): Review {
  return {
    id: row.id,
    author: row.author,
    date: new Date(row.created_at).toLocaleDateString('en-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    rating: row.rating,
    text: row.body,
  }
}

function mapSpot(row: ToiletSpotRow, reviews: Review[] = []): ToiletSpot {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    city: row.city,
    province: row.province,
    lat: row.latitude,
    lng: row.longitude,
    rating: reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0,
    price: row.price,
    amenities: row.amenities,
    image: row.image,
    description: row.description,
    verified: row.verified,
    reviews,
  }
}

export async function loadSharedSpots(): Promise<ToiletSpot[]> {
  const client = requireSupabase()
  const [spotsResult, reviewsResult] = await Promise.all([
    client.from('toilet_spots').select('*').order('created_at', { ascending: false }),
    client.from('toilet_reviews').select('*').order('created_at', { ascending: false }),
  ])

  if (spotsResult.error) throw spotsResult.error
  if (reviewsResult.error) throw reviewsResult.error

  const reviewsBySpot = new Map<string, Review[]>()
  for (const row of reviewsResult.data) {
    const reviews = reviewsBySpot.get(row.toilet_spot_id) ?? []
    reviews.push(mapReview(row))
    reviewsBySpot.set(row.toilet_spot_id, reviews)
  }

  return spotsResult.data.map((row) => mapSpot(row, reviewsBySpot.get(row.id) ?? []))
}

export async function createSharedSpot(input: NewToiletSpot): Promise<ToiletSpot> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('toilet_spots')
    .insert({
      name: input.name,
      area: input.area,
      city: input.city,
      province: input.province,
      latitude: input.lat,
      longitude: input.lng,
      price: input.price,
      amenities: input.amenities,
      image:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
      description: 'A community-added toilet spot. Add a review to share your experience.',
      verified: false,
    })
    .select()
    .single()

  if (error) throw error
  return mapSpot(data)
}

export async function createSharedReview(
  spotId: string,
  input: NewReview,
): Promise<Review> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('toilet_reviews')
    .insert({
      toilet_spot_id: spotId,
      author: input.author,
      rating: input.rating,
      body: input.text,
    })
    .select()
    .single()

  if (error) throw error
  return mapReview(data)
}
